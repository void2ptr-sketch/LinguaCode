import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
} from '../model';

import { CoursesApiService, type CourseWritePayload } from '../api/courses-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { ApiListResponse } from '../../../shared/api/api.types';
import { ProgramsApiService } from '../../program/api';

/**
 * Service for course search and management operations.
 *
 * @remarks
 * Wraps `CoursesApiService` with loading/error state management via Signals.
 */
@Injectable({ providedIn: 'root' })
export class CourseSearchService {
  private readonly coursesApi = inject(CoursesApiService);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly logger = inject(AppLoggerService);
  private readonly http = inject(HttpClient);

  /**
   * Whether course requests are served by the local mock backend
   * (seed data with string IDs) instead of the real backend. Exposed as a
   * field so tests can override it.
   */
  private readonly coursesMockEnabled = environment.useCoursesApiMock;

  /** Whether a course operation is in progress. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

  /**
   * Cache of string ID → numeric ID mapping loaded from the backend.
   *
   * @remarks
   * Seed data uses string IDs (e.g. `course-cpp-complete`). The backend expects
   * numeric IDs. This map is populated on first `resolveCourseId` call and
   * reused for subsequent lookups.
   */
  private idResolutionCache: Map<string, string> | null = null;

  private idResolutionPromise: Promise<void> | null = null;

  /** Cache for getById results to prevent redundant API calls. */
  private readonly getByIdCache = new Map<string, Promise<CourseWithPrograms>>();

  /**
   * Clears the getById cache.
   *
   * @remarks
   * Call after create/update/delete operations so subsequent reads fetch fresh data.
   */
  clearGetByIdCache(): void {
    this.getByIdCache.clear();
  }

  /**
   * Searches courses by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of course index entries.
   * @remarks
   * After the API call, results are additionally filtered client-side by
   * `knownLanguage`/`learningLanguage` when both are present. This is a
   * safety net: the backend may not filter by these parameters, so the
   * frontend must guarantee that only courses matching the active language
   * pair are shown.
   */
  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return this.run(() => this.coursesApi.search(criteria)).then((page) => {
      const known = criteria.knownLanguage;
      const learning = criteria.learningLanguage;
      if (known && learning) {
        const filtered = page.items.filter(
          (entry) => entry.knownLanguage === known && entry.learningLanguage === learning,
        );
        return {
          ...page,
          items: filtered,
          totalItems: filtered.length,
        };
      }
      return page;
    });
  }

  /**
   * Loads all courses and builds the string ID → numeric ID mapping.
   *
   * @remarks
   * Paginates through all courses via raw HTTP (bypasses CoursesApiService
   * DTO mapping) and stores the mapping in `idResolutionCache`.
   * Subsequent calls return the cached result.
   */
  private async loadIdResolutionMap(): Promise<void> {
    if (this.idResolutionCache) {
      return;
    }

    if (!this.idResolutionPromise) {
      this.idResolutionPromise = (async () => {
        const map = new Map<string, string>();
        let page = 0;
        const pageSize = 100;
        let fetched = 0;
        let hasMore = true;

        while (hasMore) {
          const params = new HttpParams()
            .set('page', String(page))
            .set('pageSize', String(pageSize));

          const response = await firstValueFrom(
            this.http.get<ApiListResponse<unknown>>(buildApiUrl('/courses/search'), { params }),
          );

          const items = (response.data as unknown as CourseIndexEntry[]) ?? [];
          fetched += items.length;
          for (const item of items) {
            // item.id is the numeric ID (as string); slug is the seed string ID.
            const slug = item.slug ?? item.id;
            map.set(slug, String(item.id));
            // Also store numeric ID as-is for direct lookup
            map.set(item.id, String(item.id));
          }

          page++;
          // `total` is the number of items (not pages): stop when everything is fetched.
          hasMore =
            response.total !== undefined ? fetched < response.total : items.length === pageSize;
        }

        this.idResolutionCache = map;
        this.idResolutionPromise = null;
      })();
    }

    return this.idResolutionPromise;
  }

  /**
   * Resolves a course ID to a numeric ID used by the backend.
   *
   * @remarks
   * Seed data uses string IDs (e.g. `course-cpp-complete`). The backend expects
   * numeric IDs. This method resolves string IDs by looking up the cached
   * mapping (loaded from the backend). Numeric IDs pass through unchanged.
   *
   * **Mock mode:** when the courses API is served by the local mock backend
   * (`useCoursesApiMock`), the search index itself contains string seed IDs
   * (slug → slug mapping), so non-numeric IDs pass through as-is — the mock
   * backend accepts them directly (mirrors {@link resolveCourseIdForWrite}).
   *
   * **Post-validation (real backend):** the resolved value is checked against
   * `^\d+$`. If the cache maps a slug to a non-numeric ID, the method returns
   * `null` instead of propagating the slug.
   *
   * @param courseId - The course ID to resolve.
   * @returns The resolved numeric course ID, or `null` if not found or non-numeric.
   */
  async resolveCourseId(courseId: string): Promise<string | null> {
    // Numeric ID — pass through
    if (/^\d+$/.test(courseId)) {
      return courseId;
    }

    // Mock backend serves seed data with string IDs — pass through as-is
    if (this.coursesMockEnabled) {
      return courseId;
    }

    // Ensure the mapping is loaded
    await this.loadIdResolutionMap();

    if (!this.idResolutionCache) {
      return null;
    }

    // Try direct match first (numeric ID passed as string)
    const direct = this.idResolutionCache.get(courseId);
    if (direct) {
      // Post-validation: ensure the resolved value is numeric
      if (/^\d+$/.test(direct)) {
        return direct;
      }
      // Cache maps slug → slug (mock mode with seed data); reject non-numeric
      this.logger.warn(
        `[CourseSearch] resolveCourseId: cache maps "${courseId}" → "${direct}" (non-numeric), returning null`,
      );
      return null;
    }

    return null;
  }

  /**
   * Retrieves a course with its programs by ID.
   *
   * @remarks
   * Tries the `/courses/{id}/journey` endpoint first. An empty program list is
   * a valid state — e.g. a freshly created course — so the journey response is
   * returned as-is. The programs-API fallback is used only when `/journey`
   * itself fails.
   *
   * @param courseId - The course ID.
   * @returns The course with programs.
   * @throws Error if the course is not found or on other errors.
   */
  async getById(courseId: string): Promise<CourseWithPrograms> {
    const resolvedId = await this.resolveCourseId(courseId);
    if (!resolvedId) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Return cached result if already resolved
    const cached = this.getByIdCache.get(resolvedId);
    if (cached) {
      return cached;
    }

    // Try /journey endpoint first. A course without programs is a normal state,
    // so an empty list is returned directly instead of triggering a redundant
    // programs-API fallback.
    try {
      const journeyCourse = await this.run(() => this.coursesApi.getJourney(resolvedId));
      const programCount = journeyCourse.programs?.length ?? 0;

      if (programCount > 0) {
        this.logger.info(`[CourseSearch] getJourney returned ${programCount} programs`);
      } else {
        this.logger.debug(`[CourseSearch] course ${resolvedId} has no programs`);
      }

      // `/courses/{id}/journey` is a minimal DTO: it does not include
      // `languagePairId`/`languagePair`. Consumers (program creation, journey
      // and card-select pair activation) rely on `course.languagePair`, so
      // merge it from the full course record when the journey response omits it.
      await this.attachCourseLanguagePair(journeyCourse, resolvedId);

      this.getByIdCache.set(resolvedId, Promise.resolve(journeyCourse));
      return journeyCourse;
    } catch (error) {
      this.logger.warn('[CourseSearch] getJourney failed, falling back to programs API', error);
    }

    // Fallback: fetch course + programs + lessons separately. Reached only when
    // `/journey` failed — not when it legitimately returned no programs.
    this.logger.info(
      `[CourseSearch] Fetching programs via ProgramsApiService for course ${resolvedId}`,
    );

    // Fetch course base to preserve metadata (title, authorId, description,
    // authoring, practiceSettings, languagePair). `CoursesApiService.getById`
    // normalises the raw backend DTO (courseDescription → description, flat
    // authoring → nested, JSON-string practiceSettings → object, languagePair).
    let courseBase: Record<string, unknown>;
    try {
      courseBase = (await this.coursesApi.getById(resolvedId)) as unknown as Record<
        string,
        unknown
      >;
    } catch {
      // If course fetch fails, create a minimal base
      courseBase = {
        id: String(resolvedId),
        title: '',
        slug: '',
        description: '',
        authorId: '',
        languagePair: { known: 'en' as const, learning: 'ru' as const },
        languagePairId: undefined as number | undefined,
        published: true,
        updatedAt: new Date().toISOString(),
      };
    }

    // Fetch programs and resolve lessons in parallel
    const programs = await this.programsApi.getByCourse(resolvedId);

    let result: CourseWithPrograms;

    if (programs.length === 0) {
      this.logger.debug(`[CourseSearch] fallback found no programs for course ${resolvedId}`);
      // Return course with empty programs — caller can handle gracefully
      result = {
        ...courseBase,
        programIds: [],
        programs: [],
      } as unknown as CourseWithPrograms;
    } else {
      const programsWithLessons = await Promise.all(
        programs.map((program) => this.programsApi.getById(program.id)),
      );

      result = {
        ...courseBase,
        programIds: programs.map((p) => p.id),
        programs: programsWithLessons,
      } as unknown as CourseWithPrograms;
    }

    // Cache the final (normalised) result — not the intermediate journey
    // response, which may have contained zero programs.
    this.getByIdCache.set(resolvedId, Promise.resolve(result));
    return result;
  }

  /**
   * Ensures a course payload exposes `languagePair` (and `languagePairId`).
   *
   * @remarks
   * The `/courses/{id}/journey` response is a minimal DTO that carries no
   * language pair fields. When the payload lacks `languagePair`, the full
   * course record (`GET /courses/{id}`) is fetched once and its pair metadata
   * is merged in. Failures are non-fatal — callers handle a missing pair
   * gracefully (the pair is optional on the backend).
   *
   * @param course - The course payload to enrich (mutated in place).
   * @param resolvedId - The resolved numeric course ID.
   */
  private async attachCourseLanguagePair(
    course: CourseWithPrograms,
    resolvedId: string,
  ): Promise<void> {
    if (course.languagePair) {
      return;
    }

    try {
      const courseRecord = await this.coursesApi.getById(resolvedId);
      const target = course as unknown as Record<string, unknown>;
      const source = courseRecord as unknown as Record<string, unknown>;

      if (source['languagePair']) {
        target['languagePair'] = source['languagePair'];
      }
      if (typeof source['languagePairId'] === 'number') {
        target['languagePairId'] = source['languagePairId'];
      }
    } catch (error) {
      this.logger.warn(
        `[CourseSearch] failed to resolve language pair for course ${resolvedId}`,
        error,
      );
    }
  }

  /**
   * Retrieves a course by ID, returning null if not found (404).
   *
   * @remarks
   * Unlike `getById`, this method does NOT throw for 404 — it returns `null`
   * so callers can handle "course not found" as a normal flow (e.g. fallback
   * to a default course). Resolves string IDs to numeric IDs automatically.
   *
   * @param courseId - The course ID.
   * @returns The course with programs, or `null` if not found.
   */
  async getByIdOrNull(courseId: string): Promise<CourseWithPrograms | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const resolvedId = await this.resolveCourseId(courseId);
      if (!resolvedId) {
        return null;
      }
      return await this.coursesApi.getById(resolvedId);
    } catch (error) {
      // Любая ошибка — возвращаем null (404, сетевые ошибки, ошибки мокового хендлера и т.д.)
      const status = this.extractStatus(error);
      if (status === 404) {
        this.logger.debug(`CourseSearch: course ${courseId} not found`, error);
      } else {
        this.logger.warn(`CourseSearch: getByIdOrNull failed for ${courseId}`, error);
      }
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with programs.
   */
  create(payload: CourseWritePayload): Promise<CourseWithPrograms> {
    return this.run(() => this.coursesApi.create(payload));
  }

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID (numeric or resolvable slug).
   * @param payload - The course write payload.
   * @returns The updated course with programs.
   */
  async update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms> {
    const resolvedId = await this.resolveCourseIdForWrite(courseId);
    return this.run(() => this.coursesApi.update(resolvedId, payload));
  }

  /**
   * Deletes a course by ID.
   *
   * @param courseId - The course ID (numeric or resolvable slug).
   */
  async delete(courseId: string): Promise<void> {
    const resolvedId = await this.resolveCourseIdForWrite(courseId);
    return this.run(() => this.coursesApi.delete(resolvedId));
  }

  /**
   * Resolves a course ID to the numeric form required by backend write
   * endpoints (`PUT`/`DELETE /courses/{id}`, bundle export, etc.).
   *
   * @remarks
   * Backend binds `{id}` path variables to `Long` backed by a `BIGINT` PK —
   * a string slug like `course-zh-radicals-214` fails binding with 400.
   * Numeric IDs pass through unchanged. When the courses API is served by the
   * local mock backend (seed data with string IDs), slugs pass through as-is.
   * Otherwise the slug is resolved via the `/courses/search` ID mapping; if it
   * cannot be resolved, a clear client-side error is thrown instead of sending
   * a doomed request.
   *
   * @param courseId - The course ID (numeric or slug).
   * @returns The numeric course ID for the real backend, or the original ID in mock mode.
   * @throws Error when a non-numeric slug cannot be resolved against the backend.
   */
  async resolveCourseIdForWrite(courseId: string): Promise<string> {
    if (this.coursesMockEnabled || /^\d+$/.test(courseId)) {
      return courseId;
    }

    const resolved = await this.resolveCourseId(courseId);
    if (!resolved) {
      throw new Error(`Course not found: ${courseId}`);
    }
    return resolved;
  }

  /**
   * Finds all courses that reference a given scenario.
   *
   * @param scenarioId - The scenario ID.
   * @returns Array of course index entries that use this scenario.
   *
   * @example
   * ```ts
   * const courses = await courseSearchService.findUsingScenario('scenario-456');
   * ```
   */
  findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]> {
    return this.run(() => this.coursesApi.findUsingScenario(scenarioId));
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await action();
    } catch (error) {
      const status = this.extractStatus(error);
      // 404 — штатная ситуация (курс/сценарий не найден), не логируем как ошибку
      if (status === 404) {
        this.error.set('Не найдено');
      } else {
        this.logger.error('CourseSearch: operation failed', error);
        this.error.set('Не удалось выполнить операцию с курсами');
      }
      throw new Error('Course operation failed');
    } finally {
      this.loading.set(false);
    }
  }

  private extractStatus(error: unknown): number | null {
    if (error && typeof error === 'object' && 'status' in error) {
      return (error as { status: number }).status;
    }
    return null;
  }
}
