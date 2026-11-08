import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
import type { ProgramWithLessons } from '../../program/model/program.types';

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

  /**
   * Searches courses by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of course index entries.
   */
  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return this.run(() => this.coursesApi.search(criteria));
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
        let hasMore = true;

        while (hasMore) {
          const params = new HttpParams()
            .set('page', String(page))
            .set('pageSize', String(pageSize));

          const response = await firstValueFrom(
            this.http.get<ApiListResponse<unknown>>(buildApiUrl('/courses/search'), { params }),
          );

          const items = (response.data as unknown as CourseIndexEntry[]) ?? [];
          for (const item of items) {
            // item.id is the numeric ID; title is the string seed ID
            map.set(item.title, String(item.id));
            // Also store numeric ID as-is for direct lookup
            map.set(item.id, String(item.id));
          }

          page++;
          hasMore = page < (response.total ?? 0);
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
   * @param courseId - The course ID to resolve.
   * @returns The resolved numeric course ID, or `null` if not found.
   */
  async resolveCourseId(courseId: string): Promise<string | null> {
    // Numeric ID — pass through
    if (/^\d+$/.test(courseId)) {
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
      return direct;
    }

    // Try matching by title (seed string ID → numeric ID)
    // The cache stores title → numeric ID, so we need to iterate
    for (const [key, value] of this.idResolutionCache) {
      if (key === courseId) {
        return value;
      }
    }

    return null;
  }

  /**
   * Retrieves a course with its programs by ID.
   *
   * @remarks
   * Tries the `/courses/{id}/journey` endpoint first. If it returns no programs,
   * falls back to fetching programs and lessons via the programs API.
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

    // Try /journey endpoint first
    try {
      const course = await this.run(() => this.coursesApi.getJourney(resolvedId));

      // If journey returns programs with lessons, use them
      if (course.programs && course.programs.length > 0) {
        this.logger.info(
          `[CourseSearch] getJourney returned ${course.programs.length} programs`,
        );
        return course;
      }
    } catch (error) {
      this.logger.warn('[CourseSearch] getJourney failed, falling back to programs API', error);
    }

    // Fallback: fetch course + programs + lessons separately
    this.logger.info(`[CourseSearch] Fetching programs via ProgramsApiService for course ${resolvedId}`);
    const programs = await this.programsApi.getByCourse(resolvedId);

    // Resolve each program with its lessons
    const programsWithLessons: ProgramWithLessons[] = [];
    for (const program of programs) {
      const programWithLessons = await this.programsApi.getById(program.id);
      programsWithLessons.push(programWithLessons);
    }

    // Build CourseWithPrograms — the course shape from /journey may differ from plain /courses/:id
    // We need at least the course base fields
    const courseBase = {
      id: String(resolvedId),
      title: '',
      description: '',
      authorId: '',
      languagePair: { known: 'en' as const, learning: 'ru' as const },
      programIds: programs.map((p) => p.id),
      published: true,
      updatedAt: new Date().toISOString(),
    };

    return { ...courseBase, programs: programsWithLessons };
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
      const status = this.extractStatus(error);
      // 404 — штатная ситуация, возвращаем null
      if (status === 404) {
        return null;
      }
      this.logger.error('CourseSearch: operation failed', error);
      this.error.set('Не удалось выполнить операцию с курсами');
      throw error;
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
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with programs.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms> {
    return this.run(() => this.coursesApi.update(courseId, payload));
  }

  /**
   * Deletes a course by ID.
   *
   * @param courseId - The course ID.
   */
  delete(courseId: string): Promise<void> {
    return this.run(() => this.coursesApi.delete(courseId));
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
