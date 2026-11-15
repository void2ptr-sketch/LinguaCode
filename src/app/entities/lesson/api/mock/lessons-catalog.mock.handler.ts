import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type { Lesson } from '../../../course/model/lesson.types';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import { loadCourseCatalogFromStorage, saveCourseCatalogToStorage } from '../../../course/storage/courses-storage';

import type { CourseCatalogState } from '../../../course/storage/courses-storage';
import type { LessonCreatePayload, LessonUpdatePayload } from '../lessons-api.service';

/**
 * Mock handler for lesson catalog operations.
 *
 * @remarks
 * Provides in-memory CRUD and retrieval for lessons using
 * `ContentSeedRepository` as the data source. Used by
 * `lessonsApiMockInterceptor` to simulate API responses during development.
 */
@Injectable({ providedIn: 'root' })
export class LessonsCatalogMockHandler {
  private readonly contentSeed = inject(ContentSeedRepository);

  private catalog: CourseCatalogState | null = null;

  /**
   * Retrieves a lesson by ID.
   *
   * @param lessonId - The unique identifier of the lesson.
   * @returns The matching `Lesson` object.
   * @throws `HttpErrorResponse` with status 404 if no lesson is found.
   */
  async getById(lessonId: string): Promise<Lesson> {
    await this.ensureData();

    const lesson = (this.catalog!.lessons ?? []).find((l) => l.id === lessonId);
    if (!lesson) {
      throw notFound(`Урок '${lessonId}' не найден`);
    }

    return { ...lesson };
  }

  /**
   * Retrieves all lessons of a program, ordered by `order`.
   *
   * @param programId - The program ID.
   * @returns Array of lessons for the program, sorted by order.
   */
  async getByProgramId(programId: string): Promise<readonly Lesson[]> {
    await this.ensureData();

    return (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === programId)
      .sort((left, right) => left.order - right.order)
      .map((lesson) => ({ ...lesson }));
  }

  /**
   * Retrieves all lessons of a course, ordered by program and lesson order.
   *
   * @param courseId - The course ID.
   * @returns Array of lessons in the course, sorted by program and order.
   * @throws `HttpErrorResponse` with status 404 if no course is found.
   */
  async getByCourseId(courseId: string): Promise<readonly Lesson[]> {
    await this.ensureData();

    // Verify course exists
    if (!this.catalog!.courses.some((c) => c.id === courseId)) {
      throw notFound(`Курс '${courseId}' не найден`);
    }

    // Get all programs for this course
    const courseProgramIds = (this.catalog!.programs ?? [])
      .filter((p) => p.courseId === courseId)
      .map((p) => p.id);

    return (this.catalog!.lessons ?? [])
      .filter((lesson) => courseProgramIds.includes(lesson.programId))
      .sort((left, right) => left.order - right.order)
      .map((lesson) => ({ ...lesson }));
  }

  /**
   * Creates a new lesson within a program.
   *
   * @param payload - The lesson creation payload.
   * @returns The created lesson.
   */
  async create(payload: LessonCreatePayload): Promise<Lesson> {
    await this.ensureData();

    const id = `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newLesson: Lesson = {
      id,
      programId: payload.programId,
      title: payload.title,
      description: payload.description,
      scenarioIds: [],
      prerequisiteLessonIds: [...(payload.prerequisiteLessonIds ?? [])],
      order: payload.order,
      updatedAt: new Date().toISOString(),
      published: payload.published ?? false,
      requiredTier: payload.requiredTier,
      languagePairId: payload.languagePairId,
      courseId: payload.courseId,
    };

    this.catalog!.lessons ??= [];
    this.catalog!.lessons.push(newLesson);
    this.persist();

    return newLesson;
  }

  /**
   * Updates an existing lesson.
   *
   * @param lessonId - The lesson ID.
   * @param payload - The lesson update payload.
   * @returns The updated lesson.
   * @throws `HttpErrorResponse` with status 404 if not found.
   */
  async update(lessonId: string, payload: LessonUpdatePayload): Promise<Lesson> {
    await this.ensureData();

    const lessons = this.catalog!.lessons ?? [];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) {
      throw notFound(`Урок '${lessonId}' не найден`);
    }

    const existing = lessons[idx];
    const updated: Lesson = {
      ...existing,
      title: payload.title,
      description: payload.description,
      prerequisiteLessonIds: [...(payload.prerequisiteLessonIds ?? [])],
      order: payload.order,
      updatedAt: new Date().toISOString(),
      published: payload.published ?? existing.published,
      requiredTier: payload.requiredTier ?? existing.requiredTier,
      languagePairId: payload.languagePairId ?? existing.languagePairId,
      courseId: payload.courseId ?? existing.courseId,
    };

    lessons[idx] = updated;
    this.persist();

    return updated;
  }

  /**
   * Deletes a lesson by ID.
   *
   * @param lessonId - The lesson ID.
   * @throws `HttpErrorResponse` with status 404 if not found.
   */
  async delete(lessonId: string): Promise<void> {
    await this.ensureData();

    const lessons = this.catalog!.lessons ?? [];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) {
      throw notFound(`Урок '${lessonId}' не найден`);
    }

    lessons.splice(idx, 1);
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
