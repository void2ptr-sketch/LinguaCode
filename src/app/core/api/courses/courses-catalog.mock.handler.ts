import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Course,
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
  Lesson,
} from '../../models';
import { paginateArray } from '../../../shared/utils/pagination';
import { UserStore } from '../../state';

import { normalizeCourseAuthoring } from '../../repositories/courses/course-authoring.utils';
import { courseToIndexEntry } from '../../repositories/courses/course-index.mapper';
import { filterCourseIndex } from '../../repositories/courses/course-search.utils';
import { ContentSeedRepository } from '../../repositories/content-seed/content-seed.repository';
import { normalizeLanguagePair } from '../../repositories/language-pair/language-pair.utils';
import { isEditableContentAuthor, isSystemAuthor } from '../../repositories/user/system-author.constants';
import {
  loadCourseCatalogFromStorage,
  saveCourseCatalogToStorage,
  type CourseCatalogState,
} from '../../repositories/courses/courses-storage';

import type { CourseWritePayload } from '../../repositories/courses/courses-api.service';

/**
 * Mock handler for course catalog operations.
 *
 * Provides in-memory search, CRUD, and retrieval for courses using
 * `ContentSeedRepository` as the data source. Used by
 * `coursesApiMockInterceptor` to simulate API responses during development.
 */
@Injectable({ providedIn: 'root' })
export class CoursesCatalogMockHandler {
  private readonly userStore = inject(UserStore);
  private readonly contentSeed = inject(ContentSeedRepository);

  private catalog: CourseCatalogState | null = null;

  /**
   * Searches the course index by the given criteria and returns a paginated result.
   *
   * @param criteria - The search criteria to filter courses.
   * @returns A `CourseSearchPage` containing the filtered courses.
   */
  async search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    await this.ensureData();

    const filtered = filterCourseIndex(
      this.catalog!.courses.map((course) =>
        courseToIndexEntry(
          course,
          this.catalog!.lessons.filter((lesson) => lesson.courseId === course.id).length,
        ),
      ),
      criteria,
      this.userStore.user().id,
    );

    return paginateArray(filtered, criteria.page);
  }

  /**
   * Retrieves a single course with its lessons by ID.
   *
   * @param courseId - The unique identifier of the course.
   * @returns The matching `CourseWithLessons` object with lessons sorted by order.
   * @throws `HttpErrorResponse` with status 404 if no course is found.
   */
  async getById(courseId: string): Promise<CourseWithLessons> {
    await this.ensureData();

    const course = this.catalog!.courses.find((item) => item.id === courseId);
    if (!course) {
      throw notFound('Курс не найден');
    }

    const lessons = this.lessonsForCourse(course).sort((left, right) => left.order - right.order);
    return { ...course, lessons };
  }

  /**
   * Creates a new course with the given lessons.
   *
   * Assigns a new UUID, normalises the language pair, and persists the catalog.
   *
   * @param payload - The course creation payload including title, lessons, and metadata.
   * @returns The created `CourseWithLessons` object.
   */
  async create(payload: CourseWritePayload): Promise<CourseWithLessons> {
    await this.ensureData();

    const languagePair = normalizeLanguagePair(payload.languagePair);
    const courseId = crypto.randomUUID();
    const lessons = this.normalizeLessons(courseId, payload.lessons);

    const course: Course = {
      id: courseId,
      title: payload.title,
      description: payload.description,
      authorId: this.userStore.user().id,
      languagePair,
      lessonIds: lessons.map((lesson) => lesson.id),
      published: payload.published,
      updatedAt: new Date().toISOString(),
      authoring: normalizeCourseAuthoring(payload.authoring),
    };

    this.catalog = {
      courses: [...this.catalog!.courses, course],
      lessons: [...this.catalog!.lessons, ...lessons],
    };
    this.persist();
    return { ...course, lessons };
  }

  /**
   * Updates an existing course with the given payload.
   *
   * Verifies edit permissions and distinguishes between system-authored and
   * user-authored courses to apply the appropriate update logic.
   *
   * @param courseId - The unique identifier of the course to update.
   * @param payload - The updated course data.
   * @returns The updated `CourseWithLessons` object.
   * @throws `HttpErrorResponse` with status 404 if not found, 403 if not authorised.
   */
  async update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons> {
    await this.ensureData();

    const current = this.catalog!.courses.find((item) => item.id === courseId);
    if (!current) {
      throw notFound('Курс не найден');
    }

    this.assertCanEdit(current);
    const languagePair = normalizeLanguagePair(payload.languagePair ?? current.languagePair);

    if (isSystemAuthor(current.authorId)) {
      const updated: Course = {
        ...current,
        title: payload.title,
        description: payload.description,
        published: payload.published,
        updatedAt: new Date().toISOString(),
        authoring: normalizeCourseAuthoring(payload.authoring ?? current.authoring),
      };
      const lessons = this.lessonsForCourse(updated).sort(
        (left, right) => left.order - right.order,
      );

      this.catalog = {
        courses: this.catalog!.courses.map((item) => (item.id === courseId ? updated : item)),
        lessons: this.catalog!.lessons,
      };
      this.persist();
      return { ...updated, lessons };
    }

    const lessons = this.normalizeLessons(courseId, payload.lessons);

    const updated: Course = {
      ...current,
      title: payload.title,
      description: payload.description,
      published: payload.published,
      languagePair,
      lessonIds: lessons.map((lesson) => lesson.id),
      updatedAt: new Date().toISOString(),
      authoring: normalizeCourseAuthoring(payload.authoring ?? current.authoring),
    };

    this.catalog = {
      courses: this.catalog!.courses.map((item) => (item.id === courseId ? updated : item)),
      lessons: [
        ...this.catalog!.lessons.filter((lesson) => lesson.courseId !== courseId),
        ...lessons,
      ],
    };
    this.persist();
    return { ...updated, lessons };
  }

  /**
   * Deletes a course and its associated lessons.
   *
   * Verifies edit permissions before removing the course from the catalog.
   *
   * @param courseId - The unique identifier of the course to delete.
   * @throws `HttpErrorResponse` with status 404 if not found, 403 if not authorised.
   */
  async delete(courseId: string): Promise<void> {
    await this.ensureData();

    const current = this.catalog!.courses.find((item) => item.id === courseId);
    if (!current) {
      throw notFound('Курс не найден');
    }

    this.assertCanEdit(current);
    this.catalog = {
      courses: this.catalog!.courses.filter((item) => item.id !== courseId),
      lessons: this.catalog!.lessons.filter((lesson) => lesson.courseId !== courseId),
    };
    this.persist();
  }

  /**
   * Finds all courses that use the given scenario in any of their lessons.
   *
   * @param scenarioId - The unique identifier of the scenario.
   * @returns An array of `CourseIndexEntry` for matching courses.
   */
  async findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]> {
    await this.ensureData();

    return this.catalog!.courses.filter((course) =>
      this.catalog!.lessons.some(
        (lesson) => lesson.courseId === course.id && lesson.scenarioIds.includes(scenarioId),
      ),
    ).map((course) =>
      courseToIndexEntry(
        course,
        this.catalog!.lessons.filter((lesson) => lesson.courseId === course.id).length,
      ),
    );
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

  private lessonsForCourse(course: Course): Lesson[] {
    return this.catalog!.lessons.filter((lesson) => course.lessonIds.includes(lesson.id));
  }

  private normalizeLessons(courseId: string, drafts: CourseWritePayload['lessons']): Lesson[] {
    return drafts.map((draft, index) => ({
      id: draft.id ?? crypto.randomUUID(),
      courseId,
      title: draft.title,
      description: draft.description,
      scenarioIds: [...new Set(draft.scenarioIds.filter(Boolean))],
      prerequisiteLessonIds: [...new Set((draft.prerequisiteLessonIds ?? []).filter(Boolean))],
      order: draft.order ?? index,
      updatedAt: new Date().toISOString(),
    }));
  }

  private assertCanEdit(course: Course): void {
    if (!isEditableContentAuthor(course.authorId, this.userStore.user().id)) {
      throw forbidden('Нельзя изменять чужой курс');
    }
  }
}

function notFound(message: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message } });
}

function forbidden(message: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 403, statusText: 'Forbidden', error: { message } });
}
