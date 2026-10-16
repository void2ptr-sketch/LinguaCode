import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
} from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildCourseSearchParams } from './mock/courses-api.params.utils';
import type {
  CourseCatalogPort,
  CourseExportBundle,
  CourseWritePayload,
} from '../repository/course-catalog.port';

export type { CourseWritePayload, LessonWritePayload } from '../repository/course-catalog.port';

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

  /**
   * Searches courses by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of course index entries.
   */
  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseSearchPage>>(buildApiUrl('/courses/search'), {
        params: buildCourseSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  /**
   * Retrieves a course with its lessons by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with lessons.
   */
  getById(courseId: string): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseWithLessons>>(buildApiUrl(`/courses/${courseId}`)),
    ).then((response) => response.data);
  }

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with lessons.
   */
  create(payload: CourseWritePayload): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.post<ApiResponse<CourseWithLessons>>(buildApiUrl('/courses'), payload),
    ).then((response) => response.data);
  }

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with lessons.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.put<ApiResponse<CourseWithLessons>>(buildApiUrl(`/courses/${courseId}`), payload),
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
   * @returns The export bundle with the resolved catalog, scenarios, cards, and metadata.
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
