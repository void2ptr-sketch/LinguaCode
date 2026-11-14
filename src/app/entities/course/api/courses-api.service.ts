import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
} from '../model';
import type { ApiResponse, ApiListResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildCourseSearchParams } from './mock/courses-api.params.utils';
import type {
  CourseCatalogPort,
  CourseExportBundle,
  CourseWritePayload,
} from '../repository/course-catalog.port';
import { AuthStore } from '../../auth/services/auth.store';
import type { ContentLanguage } from '../../card/model/card-index.types';
import { buildCourseAuthoringFromApi } from '../utils/course-authoring.utils';
import { LanguagePairsApiService } from '../../language-pair/api';
import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import { formatLanguagePair } from '../../language-pair/utils/language-pair.utils';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

/** Backend DTO for a course (matches `CourseDto`). */
type BackendCourseDto = {
  id: number;
  title: string;
  slug: string;
  courseDescription: string;
  authorId: number;
  languagePairId: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  programCount?: number;
};

/**
 * Maps a backend course DTO to a frontend `CourseIndexEntry`.
 *
 * @remarks
 * `programCount` is now provided by the backend search endpoint;
 * `languagePairSummary` is derived client-side.
 * `languagePairId` is resolved to `knownLanguage`/`learningLanguage`
 * via the `LanguagePairsApiService` cache.
 */
function toIndexEntry(
  dto: BackendCourseDto,
  pairCache: Record<number, { known: ContentLanguage; learning: ContentLanguage }>,
): CourseIndexEntry {
  const pairId = dto.languagePairId;
  const cached = pairId ? pairCache[pairId] : null;
  const known = cached?.known ?? 'ru';
  const learning = cached?.learning ?? 'en';

  return {
    id: String(dto.id),
    title: dto.title,
    slug: dto.slug ?? '',
    authorId: String(dto.authorId),
    programCount: dto.programCount ?? 0,
    published: dto.published,
    updatedAt: dto.updatedAt,
    languagePairSummary: formatLanguagePair({ known, learning }),
    knownLanguage: known,
    learningLanguage: learning,
  };
}

/**
 * Serialises course practice settings for the backend JSONB column.
 *
 * @remarks
 * The backend DTO expects a JSON string, but values coming from the fallback
 * course loader may already be strings. Re-serialising an existing string
 * would double-encode the JSONB payload, so strings pass through unchanged.
 */
function serializePracticeSettings(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export type {
  CourseWritePayload,
  LessonWritePayload,
  ProgramWritePayload,
} from '../repository/course-catalog.port';

// ── Program operations are now in ProgramsApiService ──

/**
 * HTTP API service for course operations.
 *
 * @remarks
 * Wraps the backend courses API with Promise-based methods. Implements the
 * `CourseCatalogPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class CoursesApiService implements CourseCatalogPort {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly logger = inject(AppLoggerService);

  /** Cache: languagePairId → { known, learning } resolved from `/language-pairs`. */
  private pairCache: Record<number, { known: ContentLanguage; learning: ContentLanguage }> = {};
  private pairCacheLoaded = false;

  private async ensurePairCache(): Promise<void> {
    if (this.pairCacheLoaded) return;

    try {
      const pairs = await this.languagePairsApi.listAll();
      for (const p of pairs) {
        this.pairCache[p.id] = {
          known: p.knownCode as ContentLanguage,
          learning: p.learningCode as ContentLanguage,
        };
      }
    } catch {
      // /language-pairs may require auth (403) — fallback to default mapping
      this.pairCache[1] = { known: 'ru' as ContentLanguage, learning: 'en' as ContentLanguage };
    }

    this.pairCacheLoaded = true;
  }

  /**
   * Attaches `languagePair` to a course payload when it only carries a numeric
   * `languagePairId`.
   *
   * @remarks
   * Backend course responses (including the journey payload) reference the
   * language pair by `languagePairId` and may not include the
   * `{ known, learning }` object. Callers such as the journey map and the
   * card-select page activate the course's pair via `course.languagePair`,
   * so a missing object silently disables that activation.
   */
  private async attachLanguagePair(data: Record<string, unknown>): Promise<void> {
    if (data['languagePair'] || typeof data['languagePairId'] !== 'number') {
      return;
    }

    await this.ensurePairCache();
    const codes = this.pairCache[data['languagePairId'] as number];
    if (codes) {
      data['languagePair'] = codes;
    }
  }

  /**
   * Parses `practiceSettings` from a JSONB string into an object.
   *
   * @remarks
   * The backend stores `practiceSettings` as a JSONB column and may return
   * it as a raw JSON string. This method parses it into a plain object so
   * that consumers can spread/merge the settings correctly.
   */
  private parsePracticeSettings(data: Record<string, unknown>): void {
    let value: unknown = data['practiceSettings'];
    if (value === undefined || value === null) {
      return;
    }

    // Parse repeatedly: legacy records may contain a double-encoded JSON string
    // (JSON.stringify applied to an already-stringified value).
    for (let attempt = 0; typeof value === 'string' && attempt < 3; attempt++) {
      try {
        value = JSON.parse(value);
      } catch {
        // Invalid JSON — downstream code will fall back to defaults
        value = null;
        break;
      }
    }

    data['practiceSettings'] = value;
  }

  /**
   * Normalises a raw backend course payload into the frontend `Course` shape.
   *
   * @remarks
   * The backend uses `courseDescription`, flat authoring fields and a JSON
   * string for `practiceSettings`, while the frontend entity expects
   * `description`, a nested `authoring` object and parsed settings. Keeping
   * this conversion in one place makes the journey, `getById` and fallback
   * (`CourseSearchService.getById`) paths consistent.
   */
  async normalizeCourseData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Normalize languagePairId to number BEFORE attachLanguagePair — it expects
    // a numeric value; the backend may return it as a string (JSON number
    // serialized through a generic serializer).
    if (typeof data['languagePairId'] === 'string') {
      data['languagePairId'] = Number(data['languagePairId']);
    }

    await this.attachLanguagePair(data);
    this.parsePracticeSettings(data);
    data['authoring'] = buildCourseAuthoringFromApi(
      data as unknown as Parameters<typeof buildCourseAuthoringFromApi>[0],
    );

    // Backend field name → frontend entity field name
    if (typeof data['description'] !== 'string' && typeof data['courseDescription'] === 'string') {
      data['description'] = data['courseDescription'];
    }
    if (typeof data['authorId'] === 'number') {
      data['authorId'] = String(data['authorId']);
    }

    return data;
  }

  /**
   * Resolves a frontend `{ known, learning }` pair to the backend numeric ID.
   *
   * @remarks
   * Course create/update requests accept `languagePairId` (BIGINT). The
   * frontend stores pairs as codes, so the ID is looked up in
   * `/language-pairs`. Returns `undefined` when the pair is missing or cannot
   * be resolved (the field is optional on the backend).
   */
  private async resolveLanguagePairId(pair: LanguagePair | undefined): Promise<number | undefined> {
    if (!pair) {
      return undefined;
    }

    try {
      const pairs = await this.languagePairsApi.listAll();
      return pairs.find(
        (candidate) =>
          candidate.knownCode === pair.known && candidate.learningCode === pair.learning,
      )?.id;
    } catch (error) {
      this.logger.warn('CoursesApiService: failed to resolve languagePairId', error);
      return undefined;
    }
  }

  /**
   * Searches courses by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of course index entries.
   */
  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return this.ensurePairCache().then(() =>
      firstValueFrom(
        this.http.get<ApiListResponse<BackendCourseDto>>(buildApiUrl('/courses/search'), {
          params: buildCourseSearchParams(criteria),
        }),
      ).then((response) => {
        const dtos = response.data;
        const totalItems = response.total ?? dtos.length;
        const pageSize = criteria.page.pageSize;
        const page = criteria.page.page;
        const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;

        return {
          items: dtos.map((dto) => toIndexEntry(dto, this.pairCache)),
          page,
          pageSize,
          totalItems,
          totalPages,
        };
      }),
    );
  }

  /**
   * Retrieves a course with its programs by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with programs.
   */
  getById(courseId: string): Promise<CourseWithPrograms> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseWithPrograms>>(buildApiUrl(`/courses/${courseId}`)),
    ).then(async (response) => {
      const data = await this.normalizeCourseData(
        response.data as unknown as Record<string, unknown>,
      );
      return data as unknown as CourseWithPrograms;
    });
  }

  /**
   * Retrieves a course with its programs and lessons for the journey map.
   *
   * @remarks
   * Uses the `/courses/{id}/journey` endpoint which returns the full
   * course structure with programs and lessons resolved.
   *
   * @param courseId - The course ID.
   * @returns The course with programs and lessons.
   */
  getJourney(courseId: string): Promise<CourseWithPrograms> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseWithPrograms>>(buildApiUrl(`/courses/${courseId}/journey`)),
    ).then(async (response) => {
      const data = await this.normalizeCourseData(
        response.data as unknown as Record<string, unknown>,
      );
      // Backend returns numeric IDs — convert to strings for frontend consistency
      if (Array.isArray(data['programs'])) {
        data['programs'] = (data['programs'] as Record<string, unknown>[]).map((p) => {
          const lessons = Array.isArray(p['lessons']) ? p['lessons'] : [];
          return {
            ...p,
            id: String(p['id']),
            lessons: lessons.map((l: Record<string, unknown>) => ({
              ...l,
              id: String(l['id']),
              scenarioIds: Array.isArray(l['scenarioIds'])
                ? (l['scenarioIds'] as number[]).map((s) => String(s))
                : [],
              prerequisiteLessonIds: Array.isArray(l['prerequisiteLessonIds'])
                ? (l['prerequisiteLessonIds'] as number[]).map((s) => String(s))
                : [],
            })),
          };
        });
      }
      return data as unknown as CourseWithPrograms;
    });
  }

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with programs.
   */
  async create(payload: CourseWritePayload): Promise<CourseWithPrograms> {
    const body: Record<string, unknown> = {
      title: payload.title,
      courseDescription: payload.description,
      published: payload.published,
    };
    // Send numeric authorId from authenticated user (backend derives it from JWT token)
    const userId = this.authStore.user()?.id;
    if (userId && /^\d+$/.test(userId)) {
      body['authorId'] = Number(userId);
    }
    // Backend expects the numeric language pair ID (BIGINT)
    const languagePairId = await this.resolveLanguagePairId(payload.languagePair);
    if (languagePairId !== undefined) {
      body['languagePairId'] = languagePairId;
    }
    // Programs are sent for mock handler compatibility (backend creates them separately)
    if (payload.programs && payload.programs.length > 0) {
      body['programs'] = payload.programs;
    }
    // Authoring fields (flat — matches backend CourseCreateRequest).
    // `!== undefined` (not truthiness) so an empty idea/status can clear a value.
    if (payload.authoringStatus !== undefined) {
      body['authoringStatus'] = payload.authoringStatus;
    }
    if (payload.authoringIdea !== undefined) {
      body['authoringIdea'] = payload.authoringIdea;
    }
    if (payload.ideaUpdatedAt) {
      body['ideaUpdatedAt'] = payload.ideaUpdatedAt;
    }
    if (payload.materializedAt) {
      body['materializedAt'] = payload.materializedAt;
    }
    if (payload.lastError !== undefined) {
      body['lastError'] = payload.lastError;
    }
    // practiceSettings is a JSONB column — the backend DTO expects a JSON string.
    // Values coming from the fallback loader may already be strings; do not double-encode.
    const practiceSettings = serializePracticeSettings(payload.practiceSettings);
    if (practiceSettings !== undefined) {
      body['practiceSettings'] = practiceSettings;
    }
    const response = await firstValueFrom(
      this.http.post<ApiResponse<CourseWithPrograms>>(buildApiUrl('/courses'), body),
    );
    return (await this.normalizeCourseData(
      response.data as unknown as Record<string, unknown>,
    )) as unknown as CourseWithPrograms;
  }

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with programs.
   */
  async update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms> {
    const body: Record<string, unknown> = {
      title: payload.title,
      courseDescription: payload.description,
      published: payload.published,
    };
    // Backend expects the numeric language pair ID (BIGINT)
    const languagePairId = await this.resolveLanguagePairId(payload.languagePair);
    if (languagePairId !== undefined) {
      body['languagePairId'] = languagePairId;
    }
    // NOTE: This endpoint updates only the `education_courses` table. Nested
    // programs/lessons are persisted through ProgramsApiService/LessonsApiService,
    // so they must not be part of the course update body (the backend rejects the
    // internal ProgramWritePayload shape).
    // Authoring fields (flat — matches backend CourseUpdateRequest).
    // `!== undefined` (not truthiness) so an empty idea/status can clear a value.
    if (payload.authoringStatus !== undefined) {
      body['authoringStatus'] = payload.authoringStatus;
    }
    if (payload.authoringIdea !== undefined) {
      body['authoringIdea'] = payload.authoringIdea;
    }
    if (payload.ideaUpdatedAt) {
      body['ideaUpdatedAt'] = payload.ideaUpdatedAt;
    }
    if (payload.materializedAt) {
      body['materializedAt'] = payload.materializedAt;
    }
    if (payload.lastError !== undefined) {
      body['lastError'] = payload.lastError;
    }
    // practiceSettings is a JSONB column — the backend DTO expects a JSON string.
    // Values coming from the fallback loader may already be strings; do not double-encode.
    const practiceSettings = serializePracticeSettings(payload.practiceSettings);
    if (practiceSettings !== undefined) {
      body['practiceSettings'] = practiceSettings;
    }
    const response = await firstValueFrom(
      this.http.put<ApiResponse<CourseWithPrograms>>(buildApiUrl(`/courses/${courseId}`), body),
    );
    return (await this.normalizeCourseData(
      response.data as unknown as Record<string, unknown>,
    )) as unknown as CourseWithPrograms;
  }

  /**
   * Deletes a course by ID.
   *
   * @param courseId - The course ID.
   *
   * @example
   * ```ts
   * await coursesApi.delete('course-123');
   * ```
   */
  delete(courseId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/courses/${courseId}`)),
    ).then(() => undefined);
  }

  /**
   * Finds all courses that reference a given scenario.
   *
   * @param scenarioId - The scenario ID.
   * @returns Array of course index entries that use this scenario.
   */
  findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly CourseIndexEntry[]>>(
        buildApiUrl(`/courses/by-scenario/${scenarioId}`),
      ),
    ).then((response) => response.data);
  }

  /**
   * Retrieves a self-contained export bundle for a course.
   *
   * @param courseId - The course ID.
   * @returns The export bundle with the resolved catalog, programs, lessons, scenarios, cards, and metadata.
   *
   * @example
   * ```ts
   * const bundle = await coursesApi.getBundle('course-123');
   * ```
   */
  getBundle(courseId: string): Promise<CourseExportBundle> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseExportBundle>>(buildApiUrl(`/courses/${courseId}/bundle`)),
    ).then((response) => response.data);
  }
}
