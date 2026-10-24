import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Program, ProgramWithLessons } from '../model';
import type { ProgramSearchCriteria, ProgramSearchPage } from '../model/program-search.types';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { ProgramCatalogPort, ProgramWritePayload } from '../repository/program-catalog.port';

export type { ProgramWritePayload } from '../repository/program-catalog.port';

/**
 * HTTP API service for program operations.
 *
 * @remarks
 * Wraps the backend programs API with Promise-based methods. Implements the
 * `ProgramCatalogPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class ProgramsApiService implements ProgramCatalogPort {
  private readonly http = inject(HttpClient);

  /**
   * Searches programs by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of program index entries.
   *
   * @example
   * ```ts
   * const results = await programsApi.search({
   *   query: 'Greetings',
   *   page: { page: 0, pageSize: 20 },
   * });
   * ```
   */
  search(criteria: ProgramSearchCriteria): Promise<ProgramSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<ProgramSearchPage>>(buildApiUrl('/programs/search'), {
        params: buildProgramSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  /**
   * Retrieves a program with its lessons fully resolved.
   *
   * @param programId - The program ID.
   * @returns The program with lessons.
   *
   * @example
   * ```ts
   * const program = await programsApi.getById('program-123');
   * ```
   */
  getById(programId: string): Promise<ProgramWithLessons> {
    return firstValueFrom(
      this.http.get<ApiResponse<ProgramWithLessons>>(buildApiUrl(`/programs/${programId}`)),
    ).then((response) => response.data);
  }

  /**
   * Retrieves all programs for a given course.
   *
   * @param courseId - The course ID.
   * @returns Array of programs in the course.
   *
   * @example
   * ```ts
   * const programs = await programsApi.getByCourse('course-456');
   * ```
   */
  getByCourse(courseId: string): Promise<readonly Program[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly Program[]>>(
        buildApiUrl(`/programs/by-course/${Number(courseId)}`),
      ),
    ).then((response) => response.data);
  }

  /**
   * Creates a new program within a course.
   *
   * @param payload - The program write payload.
   * @returns The created program.
   *
   * @example
   * ```ts
   * const program = await programsApi.create({
   *   courseId: 'course-123',
   *   title: 'Daily Greetings',
   *   description: 'Common phrases for everyday use',
   *   lessonIds: ['lesson-1', 'lesson-2'],
   *   order: 0,
   * });
   * ```
   */
  create(payload: ProgramWritePayload): Promise<Program> {
    return firstValueFrom(
      this.http.post<ApiResponse<Program>>(buildApiUrl('/programs'), payload),
    ).then((response) => response.data);
  }

  /**
   * Updates an existing program.
   *
   * @param programId - The program ID.
   * @param payload - The program write payload.
   * @returns The updated program.
   *
   * @example
   * ```ts
   * const updated = await programsApi.update('program-123', {
   *   courseId: 'course-123',
   *   title: 'Updated Title',
   *   description: 'New description',
   *   lessonIds: ['lesson-1'],
   *   order: 0,
   * });
   * ```
   */
  update(programId: string, payload: ProgramWritePayload): Promise<Program> {
    return firstValueFrom(
      this.http.put<ApiResponse<Program>>(buildApiUrl(`/programs/${programId}`), payload),
    ).then((response) => response.data);
  }

  /**
   * Deletes a program by ID.
   *
   * @param programId - The program ID.
   *
   * @example
   * ```ts
   * await programsApi.delete('program-123');
   * ```
   */
  delete(programId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/programs/${programId}`)),
    ).then(() => undefined);
  }
}

/**
 * Builds query parameters for program search requests.
 *
 * @param criteria - The search criteria.
 * @returns URL params object.
 */
function buildProgramSearchParams(criteria: ProgramSearchCriteria): Record<string, string> {
  const params: Record<string, string> = {};

  if (criteria.query) {
    params['query'] = criteria.query;
  }

  if (criteria.courseId) {
    params['courseId'] = String(Number(criteria.courseId));
  }

  if (criteria.page) {
    if (criteria.page.page !== undefined) {
      params['page'] = String(criteria.page.page);
    }
    if (criteria.page.pageSize !== undefined) {
      params['pageSize'] = String(criteria.page.pageSize);
    }
  }

  return params;
}
