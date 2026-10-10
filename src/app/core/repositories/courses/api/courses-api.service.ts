import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
  LanguagePair,
} from '../../../models';
import type { CourseAuthoring } from '../../../models/course-authoring.types';
import type { ApiResponse } from '../../../api/api.types';
import { buildApiUrl } from '../../../api/api-url';
import { buildCourseSearchParams } from '../../../api/courses/courses-api.params.utils';

/**
 * Payload for creating or updating a lesson via the courses API.
 *
 * @remarks
 * Used in `CourseWritePayload.lessons` to send lesson data to the backend.
 */
export type LessonWritePayload = {
  id?: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds?: readonly string[];
  order: number;
};

/**
 * Payload for creating or updating a course via the courses API.
 *
 * @remarks
 * Includes lessons, authoring notes, and language pair information.
 */
export type CourseWritePayload = {
  title: string;
  description: string;
  published: boolean;
  languagePair?: LanguagePair;
  lessons: readonly LessonWritePayload[];
  authoring?: CourseAuthoring;
};

/**
 * HTTP API service for course operations.
 *
 * @remarks
 * Wraps the backend courses API with Promise-based methods.
 */
@Injectable({ providedIn: 'root' })
export class CoursesApiService {
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
}
