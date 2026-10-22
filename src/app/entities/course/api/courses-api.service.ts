import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
  ProgramWithLessons,
} from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildCourseSearchParams } from './mock/courses-api.params.utils';
import type {
  CourseCatalogPort,
  CourseExportBundle,
  CourseWritePayload,
  ProgramWritePayload,
} from '../repository/course-catalog.port';

export type { CourseWritePayload, LessonWritePayload, ProgramWritePayload } from '../repository/course-catalog.port';

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
    return firstValueFrom(
      this.http.post<ApiResponse<CourseWithPrograms>>(buildApiUrl('/courses'), payload),
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
    return firstValueFrom(
      this.http.put<ApiResponse<CourseWithPrograms>>(buildApiUrl(`/courses/${courseId}`), payload),
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

  // ── Program operations ──

  /**
   * Retrieves a program with its lessons by ID.
   *
   * @param programId - The program ID.
   * @returns The program with lessons.
   */
  getProgramById(programId: string): Promise<ProgramWithLessons> {
    return firstValueFrom(
      this.http.get<ApiResponse<ProgramWithLessons>>(buildApiUrl(`/programs/${programId}`)),
    ).then((response) => response.data);
  }

  /**
   * Creates a new program within a course.
   *
   * @param payload - The program write payload.
   * @returns The created program with lessons.
   */
  createProgram(payload: ProgramWritePayload): Promise<ProgramWithLessons> {
    return firstValueFrom(
      this.http.post<ApiResponse<ProgramWithLessons>>(buildApiUrl('/programs'), payload),
    ).then((response) => response.data);
  }

  /**
   * Updates an existing program.
   *
   * @param programId - The program ID.
   * @param payload - The program write payload.
   * @returns The updated program with lessons.
   */
  updateProgram(programId: string, payload: ProgramWritePayload): Promise<ProgramWithLessons> {
    return firstValueFrom(
      this.http.put<ApiResponse<ProgramWithLessons>>(buildApiUrl(`/programs/${programId}`), payload),
    ).then((response) => response.data);
  }

  /**
   * Deletes a program by ID.
   *
   * @param programId - The program ID.
   */
  deleteProgram(programId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/programs/${programId}`)),
    ).then(() => undefined);
  }

  /**
   * Retrieves all lessons for a given program.
   *
   * @param programId - The program ID.
   * @returns Array of lessons in the program.
   */
  getLessons(programId: string): Promise<readonly import('../model').Lesson[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly import('../model').Lesson[]>>(
        buildApiUrl(`/programs/${programId}/lessons`),
      ),
    ).then((response) => response.data);
  }
}
