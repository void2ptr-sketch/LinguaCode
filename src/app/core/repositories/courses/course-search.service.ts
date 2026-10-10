import { Injectable, inject, signal } from '@angular/core';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
} from '../../models';

import { CoursesApiService, type CourseWritePayload } from './courses-api.service';

/**
 * Service for course search and management operations.
 *
 * @remarks
 * Wraps `CoursesApiService` with loading/error state management via Signals.
 */
@Injectable({ providedIn: 'root' })
export class CourseSearchService {
  private readonly coursesApi = inject(CoursesApiService);

  /** Whether a course operation is in progress. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

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
   * Retrieves a course with its lessons by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with lessons.
   */
  getById(courseId: string): Promise<CourseWithLessons> {
    return this.run(() => this.coursesApi.getById(courseId));
  }

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with lessons.
   */
  create(payload: CourseWritePayload): Promise<CourseWithLessons> {
    return this.run(() => this.coursesApi.create(payload));
  }

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with lessons.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons> {
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
    } catch {
      this.error.set('Не удалось выполнить операцию с курсами');
      throw new Error('Course operation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
