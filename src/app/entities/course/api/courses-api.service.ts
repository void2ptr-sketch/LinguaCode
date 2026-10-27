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
import { UserStore } from '../../user/model/user.store';
import type { ContentLanguage } from '../../card/model/card-index.types';
import { LanguagePairsApiService } from '../../language-pair/api';

/** Backend DTO for a course (matches `CourseDto`). */
type BackendCourseDto = {
  id: number;
  title: string;
  courseDescription: string;
  authorId: number;
  languagePairId: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Maps a backend course DTO to a frontend `CourseIndexEntry`.
 *
 * @remarks
 * The backend `CourseDto` does not include `programCount` or
 * `languagePairSummary` — these are derived client-side.
 * `languagePairId` is resolved to `knownLanguage`/`learningLanguage`
 * via the `LanguagePairsApiService` cache.
 */
function toIndexEntry(
  dto: BackendCourseDto,
  pairCache: Record<number, { known: ContentLanguage; learning: ContentLanguage }>,
): CourseIndexEntry {
  const pairId = dto.languagePairId;
  const cached = pairId ? pairCache[pairId] : null;

  return {
    id: String(dto.id),
    title: dto.title,
    authorId: String(dto.authorId),
    programCount: 0, // not available in the list response
    published: dto.published,
    updatedAt: dto.updatedAt,
    languagePairSummary: pairId ? String(pairId) : '',
    knownLanguage: cached?.known ?? 'ru',
    learningLanguage: cached?.learning ?? 'en',
  };
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
  private readonly userStore = inject(UserStore);
  private readonly languagePairsApi = inject(LanguagePairsApiService);

  /** Cache: languagePairId → { known, learning } resolved from `/language-pairs`. */
  private pairCache: Record<number, { known: ContentLanguage; learning: ContentLanguage }> = {};
  private pairCacheLoaded = false;

  private async ensurePairCache(): Promise<void> {
    if (this.pairCacheLoaded) return;

    try {
      const pairs = await this.languagePairsApi.listAll();
      for (const p of pairs) {
        this.pairCache[p.id] = { known: p.knownCode as ContentLanguage, learning: p.learningCode as ContentLanguage };
      }
    } catch {
      // /language-pairs may require auth (403) — fallback to default mapping
      this.pairCache[1] = { known: 'ru' as ContentLanguage, learning: 'en' as ContentLanguage };
    }

    this.pairCacheLoaded = true;
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
    ).then((response) => response.data);
  }

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with programs.
   */
  create(payload: CourseWritePayload): Promise<CourseWithPrograms> {
    const body: Record<string, unknown> = {
      title: payload.title,
      courseDescription: payload.description,
      authorId: this.userStore.user().id,
      published: payload.published,
    };
    // Programs are sent for mock handler compatibility (backend creates them separately)
    if (payload.programs && payload.programs.length > 0) {
      body['programs'] = payload.programs;
    }
    return firstValueFrom(
      this.http.post<ApiResponse<CourseWithPrograms>>(buildApiUrl('/courses'), body),
    ).then((response) => response.data);
  }

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with programs.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms> {
    const body = {
      title: payload.title,
      courseDescription: payload.description,
      published: payload.published,
    };
    return firstValueFrom(
      this.http.put<ApiResponse<CourseWithPrograms>>(buildApiUrl(`/courses/${courseId}`), body),
    ).then((response) => response.data);
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
