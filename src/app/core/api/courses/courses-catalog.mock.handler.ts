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
import { paginateArray } from '../../../shared/pagination';
import { UserStore } from '../../state';

import { normalizeCourseAuthoring } from '../../data/courses/course-authoring.utils';
import { courseToIndexEntry } from '../../data/courses/course-index.mapper';
import { filterCourseIndex } from '../../data/courses/course-search.utils';
import { ContentSeedRepository } from '../../data/content-seed/content-seed.repository';
import { normalizeLanguagePair } from '../../data/language-pair/language-pair.utils';
import { isEditableContentAuthor, isSystemAuthor } from '../../data/user/system-author.constants';
import {
  loadCourseCatalogFromStorage,
  saveCourseCatalogToStorage,
  type CourseCatalogState,
} from '../../data/courses/courses-storage';

import type { CourseWritePayload } from '../../data/courses/courses-api.service';

@Injectable({ providedIn: 'root' })
export class CoursesCatalogMockHandler {
  private readonly userStore = inject(UserStore);
  private readonly contentSeed = inject(ContentSeedRepository);

  private catalog: CourseCatalogState | null = null;

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

  async getById(courseId: string): Promise<CourseWithLessons> {
    await this.ensureData();

    const course = this.catalog!.courses.find((item) => item.id === courseId);
    if (!course) {
      throw notFound('Курс не найден');
    }

    const lessons = this.lessonsForCourse(course).sort((left, right) => left.order - right.order);
    return { ...course, lessons };
  }

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
