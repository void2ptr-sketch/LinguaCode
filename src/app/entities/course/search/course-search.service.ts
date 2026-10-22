import { Injectable, inject, signal } from '@angular/core';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
  ProgramWithLessons,
} from '../model';

import { CoursesApiService, type CourseWritePayload, type ProgramWritePayload } from '../api/courses-api.service';
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
   */
  getById(courseId: string): Promise<CourseWithPrograms> {
    return this.run(() => this.coursesApi.getById(courseId));
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

  // ── Program operations ──

  /**
   * Retrieves a program with its lessons by ID.
   *
   * @param programId - The program ID.
   * @returns The program with lessons.
   */
  getProgramById(programId: string): Promise<ProgramWithLessons> {
    return this.run(() => this.coursesApi.getProgramById(programId));
  }

  /**
   * Creates a new program within a course.
   *
   * @param payload - The program write payload.
   * @returns The created program with lessons.
   */
  createProgram(payload: ProgramWritePayload): Promise<ProgramWithLessons> {
    return this.run(() => this.coursesApi.createProgram(payload));
  }

  /**
   * Updates an existing program.
   *
   * @param programId - The program ID.
   * @param payload - The program write payload.
   * @returns The updated program with lessons.
   */
  updateProgram(programId: string, payload: ProgramWritePayload): Promise<ProgramWithLessons> {
    return this.run(() => this.coursesApi.updateProgram(programId, payload));
  }

  /**
   * Deletes a program by ID.
   *
   * @param programId - The program ID.
   */
  deleteProgram(programId: string): Promise<void> {
    return this.run(() => this.coursesApi.deleteProgram(programId));
  }

  /**
   * Retrieves all lessons for a given program.
   *
   * @param programId - The program ID.
   * @returns Array of lessons in the program.
   */
  getLessons(programId: string): Promise<readonly import('../model').Lesson[]> {
    return this.run(() => this.coursesApi.getLessons(programId));
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await action();
    } catch (error) {
      this.logger.error('CourseSearch: operation failed', error);
      this.error.set('Не удалось выполнить операцию с курсами');
      throw new Error('Course operation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
