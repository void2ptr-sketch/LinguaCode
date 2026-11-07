import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Program,
  ProgramIndexEntry,
  ProgramSearchCriteria,
  ProgramSearchPage,
  ProgramWithLessons,
} from '../../model';
import type { ProgramWritePayload } from '../../repository/program-catalog.port';
import { paginateArray } from '../../../../shared/utils/pagination';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import { loadCourseCatalogFromStorage } from '../../../course/storage/courses-storage';

import type { CourseCatalogState } from '../../../course/storage/courses-storage';
import { saveCourseCatalogToStorage } from '../../../course/storage/courses-storage';

/**
 * Mock handler for program catalog operations.
 *
 * @remarks
 * Provides in-memory search, CRUD, and retrieval for programs using
 * `ContentSeedRepository` as the data source. Used by
 * `programsApiMockInterceptor` to simulate API responses during development.
 */
@Injectable({ providedIn: 'root' })
export class ProgramsCatalogMockHandler {
  private readonly contentSeed = inject(ContentSeedRepository);

  private catalog: CourseCatalogState | null = null;

  /**
   * Searches programs by criteria and returns a paginated result.
   *
   * @param criteria - The search criteria to filter programs.
   * @returns A `ProgramSearchPage` containing the filtered programs.
   */
  async search(criteria: ProgramSearchCriteria): Promise<ProgramSearchPage> {
    await this.ensureData();

    const allPrograms = this.catalog!.programs ?? [];
    const filtered: ProgramIndexEntry[] = allPrograms
      .filter((program) => {
        // Filter by courseId if specified
        if (criteria.courseId && program.courseId !== criteria.courseId) {
          return false;
        }

        // Filter by query (title search)
        if (criteria.query) {
          const queryLower = criteria.query.toLowerCase();
          if (!program.title.toLowerCase().includes(queryLower)) {
            return false;
          }
        }

        return true;
      })
      .map((program) => ({
        id: program.id,
        courseId: program.courseId,
        title: program.title,
        order: program.order,
        lessonCount: program.lessonIds?.length ?? 0,
        updatedAt: program.updatedAt,
      }));

    return paginateArray(filtered, criteria.page);
  }

  /**
   * Retrieves a program with its lessons fully resolved.
   *
   * @param programId - The unique identifier of the program.
   * @returns The matching `ProgramWithLessons` object.
   * @throws `HttpErrorResponse` with status 404 if no program is found.
   */
  async getById(programId: string): Promise<ProgramWithLessons> {
    await this.ensureData();

    const program = (this.catalog!.programs ?? []).find((p) => p.id === programId);
    if (!program) {
      throw notFound(`Программа '${programId}' не найдена`);
    }

    const lessons = (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === programId)
      .sort((left, right) => left.order - right.order);

    return { ...program, lessons };
  }

  /**
   * Retrieves all programs for a given course.
   *
   * @param courseId - The course ID.
   * @returns Array of programs in the course, sorted by order.
   * @throws `HttpErrorResponse` with status 404 if no course is found.
   */
  async getByCourse(courseId: string): Promise<readonly Program[]> {
    await this.ensureData();

    // Verify course exists
    if (!this.catalog!.courses.some((c) => c.id === courseId)) {
      throw notFound(`Курс '${courseId}' не найден`);
    }

    const programs = (this.catalog!.programs ?? [])
      .filter((p) => p.courseId === courseId)
      .sort((left, right) => left.order - right.order);

    return programs;
  }

  /**
   * Creates a new program within a course.
   *
   * @param payload - The program creation payload.
   * @returns The created program.
   */
  async create(payload: ProgramWritePayload): Promise<Program> {
    await this.ensureData();

    const id = payload.id ?? `program-${Date.now()}`;
    const newProgram: Program = {
      id,
      courseId: payload.courseId,
      title: payload.title,
      description: payload.description,
      lessonIds: payload.lessonIds,
      order: payload.order,
      updatedAt: new Date().toISOString(),
    };

    this.catalog!.programs ??= [];
    this.catalog!.programs.push(newProgram);
    this.persist();

    return newProgram;
  }

  /**
   * Updates an existing program.
   *
   * @param programId - The program ID.
   * @param payload - The program update payload.
   * @returns The updated program.
   * @throws `HttpErrorResponse` with status 404 if not found.
   */
  async update(programId: string, payload: ProgramWritePayload): Promise<Program> {
    await this.ensureData();

    const programs = this.catalog!.programs ?? [];
    const idx = programs.findIndex((p) => p.id === programId);
    if (idx === -1) {
      throw notFound(`Программа '${programId}' не найдена`);
    }

    const existing = programs[idx];
    const updated: Program = {
      ...existing,
      courseId: payload.courseId,
      title: payload.title,
      description: payload.description,
      lessonIds: payload.lessonIds,
      order: payload.order,
      updatedAt: new Date().toISOString(),
    };

    programs[idx] = updated;
    this.persist();

    return updated;
  }

  /**
   * Deletes a program by ID.
   *
   * @param programId - The program ID.
   * @throws `HttpErrorResponse` with status 404 if not found.
   */
  async delete(programId: string): Promise<void> {
    await this.ensureData();

    const programs = this.catalog!.programs ?? [];
    const idx = programs.findIndex((p) => p.id === programId);
    if (idx === -1) {
      throw notFound(`Программа '${programId}' не найдена`);
    }

    programs.splice(idx, 1);
    this.persist();
  }

  /**
   * Clears the cached catalog data, forcing a reload on the next operation.
   */
  resetCache(): void {
    this.catalog = null;
  }

  private async ensureData(): Promise<void> {
    await this.contentSeed.preload();
    this.catalog = loadCourseCatalogFromStorage();
  }

  private persist(): void {
    saveCourseCatalogToStorage(this.catalog!);
  }
}

function notFound(message: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message } });
}
