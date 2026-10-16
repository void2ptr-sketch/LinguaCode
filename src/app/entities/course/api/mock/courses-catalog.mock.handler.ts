import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Course,
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
  Lesson,
} from '../../model';
import { paginateArray } from '../../../../shared/utils/pagination';
import { UserStore } from '../../../user/model/user.store';

import { normalizeCourseAuthoring } from '../../utils/course-authoring.utils';
import { courseToIndexEntry } from '../../mapping/course-index.mapper';
import { filterCourseIndex } from '../../search/course-search.utils';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import { normalizeLanguagePair } from '../../../language-pair/lib/language-pair.utils';
import { isEditableContentAuthor, isSystemAuthor } from '../../../user/lib/system-author.constants';
import {
  loadCourseCatalogFromStorage,
  saveCourseCatalogToStorage,
  type CourseCatalogState,
} from '../../storage/courses-storage';
import { CardRepository } from '../../../card/repository/card.repository';
import { loadCardIndexMetaOverrides } from '../../../card/storage/card-index-meta.storage';
import { loadScenariosFromStorage } from '../../../scenario/storage/scenarios-storage';

import type { CourseExportBundle, CourseWritePayload } from '../../repository/course-catalog.port';

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
  private readonly cardRepository = inject(CardRepository);

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
   * Retrieves a self-contained export bundle for a course.
   *
   * @param courseId - The course ID.
   * @returns The export bundle with the resolved catalog, scenarios, cards, and metadata.
   * @throws `HttpErrorResponse` with status 404 if no course is found.
   */
  async getBundle(courseId: string): Promise<CourseExportBundle> {
    await this.ensureData();

    if (!this.catalog!.courses.some((course) => course.id === courseId)) {
      throw notFound('Курс не найден');
    }

    return {
      catalog: this.catalog!,
      scenarios: loadScenariosFromStorage(),
      cards: this.cardRepository.loadStored(),
      cardIndexMeta: loadCardIndexMetaOverrides(),
    };
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
