import { Injectable, inject, signal } from '@angular/core';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
} from '../model';

import { CoursesApiService, type CourseWritePayload } from '../api/courses-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

/**
 * Service for course search and management operations.
 *
 * @remarks
 * Wraps `CoursesApiService` with loading/error state management via Signals.
 */
@Injectable({ providedIn: 'root' })
export class CourseSearchService {
  private readonly coursesApi = inject(CoursesApiService);
  private readonly logger = inject(AppLoggerService);

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
   * Retrieves a course with its programs by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with programs.
   * @throws Error if the course is not found or on other errors.
   */
  getById(courseId: string): Promise<CourseWithPrograms> {
    return this.run(() => this.coursesApi.getById(courseId));
  }

  /**
   * Retrieves a course by ID, returning null if not found (404).
   *
   * @remarks
   * Unlike `getById`, this method does NOT throw for 404 — it returns `null`
   * so callers can handle "course not found" as a normal flow (e.g. fallback
   * to a default course).
   *
   * @param courseId - The course ID.
   * @returns The course with programs, or `null` if not found.
   */
  async getByIdOrNull(courseId: string): Promise<CourseWithPrograms | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await this.coursesApi.getById(courseId);
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
