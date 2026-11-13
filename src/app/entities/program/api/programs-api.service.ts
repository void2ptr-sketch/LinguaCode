import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Program, ProgramRequiredTier, ProgramWithLessons } from '../model';
import type { ProgramSearchCriteria, ProgramSearchPage } from '../model/program-search.types';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { ProgramCatalogPort, ProgramWritePayload } from '../repository/program-catalog.port';
import { UserStore } from '../../user/model/user.store';

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
  private readonly userStore = inject(UserStore);

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
    ).then((response) => {
      const raw = response.data as Record<string, unknown>;
      return {
        ...raw,
        id: String(raw['id']),
        courseId: String(raw['courseId']),
        description: (raw['programDescription'] ?? raw['description']) as string,
        lessonIds: raw['lessonIds'] ? (raw['lessonIds'] as number[]).map((l) => String(l)) : [],
        requiredTier: raw['requiredTier'] as ProgramRequiredTier | undefined,
        languagePairId: raw['languagePairId'] as number | undefined,
        published: raw['published'] as boolean | undefined,
        updatedAt: raw['updatedAt'] as string,
        lessons: (raw['lessons'] as import('../../course/model').Lesson[] | undefined)?.map((l) => ({
          ...l,
          id: String(l.id),
          programId: String(l.programId),
          scenarioIds: (l.scenarioIds ?? []).map((s) => String(s)),
          prerequisiteLessonIds: Array.isArray(l.prerequisiteLessonIds)
            ? (l.prerequisiteLessonIds as number[]).map((p) => String(p))
            : [],
        })) ?? [],
      } as unknown as ProgramWithLessons;
    });
  }

  /**
   * Retrieves all programs for a given course with lessons resolved.
   *
   * @remarks
   * Uses the `/programs/by-course/{courseId}/with-lessons` endpoint which
   * returns programs with full lesson details including scenario IDs.
   *
   * @param courseId - The course ID.
   * @returns Array of programs with lessons in the course.
   *
   * @example
   * ```ts
   * const programs = await programsApi.getByCourse('course-456');
   * ```
   */
  getByCourse(courseId: string): Promise<readonly ProgramWithLessons[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<ProgramWithLessons[]>>(
        buildApiUrl(`/programs/by-course/${courseId}/with-lessons`),
      ),
    ).then(
      (response) =>
        (response.data ?? []).map((p) => {
          const raw = p as Record<string, unknown>;
          return {
            ...p,
            id: String(raw['id']),
            courseId: String(raw['courseId']),
            description: (raw['programDescription'] ?? raw['description']) as string,
            lessonIds: (raw['lessonIds'] as string[] | undefined)?.map((l) => String(l)),
            requiredTier: raw['requiredTier'] as ProgramRequiredTier | undefined,
            languagePairId: raw['languagePairId'] as number | undefined,
            published: raw['published'] as boolean | undefined,
            updatedAt: raw['updatedAt'] as string,
            lessons: ((raw['lessons'] as import('../../course/model').Lesson[] | undefined) ?? []).map((l: import('../../course/model').Lesson) => ({
              ...l,
              id: String(l.id),
              programId: String(l.programId),
              scenarioIds: (l.scenarioIds ?? []).map((s) => String(s)),
              prerequisiteLessonIds: Array.isArray(l.prerequisiteLessonIds)
                ? (l.prerequisiteLessonIds as number[]).map((p) => String(p))
                : [],
            })),
          } as unknown as ProgramWithLessons;
        }),
    );
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
    const body = {
      title: payload.title,
      programDescription: payload.description,
      // Backend expects a numeric course ID (BIGINT PK); the mock backend
      // understands slug IDs, so non-numeric IDs pass through unchanged.
      courseId: /^\d+$/.test(payload.courseId) ? Number(payload.courseId) : payload.courseId,
      requiredTier: payload.requiredTier,
      order: payload.order,
      languagePairId: payload.languagePairId,
    };
    return firstValueFrom(
      this.http.post<ApiResponse<Program>>(buildApiUrl('/programs'), body),
    ).then((response) => {
      const raw = response.data as Record<string, unknown>;
      return {
        ...raw,
        id: String(raw['id']),
        courseId: String(raw['courseId']),
        description: (raw['programDescription'] ?? raw['description']) as string,
        lessonIds: raw['lessonIds'] ? (raw['lessonIds'] as number[]).map((l) => String(l)) : [],
        requiredTier: raw['requiredTier'] as ProgramRequiredTier | undefined,
        languagePairId: raw['languagePairId'] as number | undefined,
        published: raw['published'] as boolean | undefined,
        updatedAt: raw['updatedAt'] as string,
      } as unknown as Program;
    });
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
    const body = {
      title: payload.title,
      programDescription: payload.description,
      requiredTier: payload.requiredTier,
      order: payload.order,
      languagePairId: payload.languagePairId,
      published: payload.published,
    };
    return firstValueFrom(
      this.http.put<ApiResponse<Program>>(buildApiUrl(`/programs/${programId}`), body),
    ).then((response) => {
      const raw = response.data as Record<string, unknown>;
      return {
        ...raw,
        id: String(raw['id']),
        courseId: String(raw['courseId']),
        description: (raw['programDescription'] ?? raw['description']) as string,
        lessonIds: raw['lessonIds'] ? (raw['lessonIds'] as number[]).map((l) => String(l)) : [],
        requiredTier: raw['requiredTier'] as ProgramRequiredTier | undefined,
        languagePairId: raw['languagePairId'] as number | undefined,
        published: raw['published'] as boolean | undefined,
        updatedAt: raw['updatedAt'] as string,
      } as unknown as Program;
    });
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
    params['courseId'] = String(criteria.courseId);
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
