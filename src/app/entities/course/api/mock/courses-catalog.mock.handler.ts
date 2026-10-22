import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Course,
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
  Lesson,
  Program,
} from '../../model';
import type { ProgramWithLessons } from '../../../program/model/program.types';
import type { ProgramWritePayload } from '../../repository/course-catalog.port';
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
          course.programIds.length,
        ),
      ),
      criteria,
      this.userStore.user().id,
    );

    return paginateArray(filtered, criteria.page);
  }

  /**
   * Retrieves a single course with its programs by ID.
   *
   * @param courseId - The unique identifier of the course.
   * @returns The matching `CourseWithPrograms` object with programs and lessons.
   * @throws `HttpErrorResponse` with status 404 if no course is found.
   */
  async getById(courseId: string): Promise<CourseWithPrograms> {
    await this.ensureData();

    const course = this.catalog!.courses.find((item) => item.id === courseId);
    if (!course) {
      throw notFound('Курс не найден');
    }

    const programs = await this.programsWithLessonsForCourse(course);
    return { ...course, programs };
  }

  /**
   * Creates a new course with the given programs.
   *
   * Assigns a new UUID, normalises the language pair, and persists the catalog.
   *
   * @param payload - The course creation payload including title, programs, and metadata.
   * @returns The created `CourseWithPrograms` object.
   */
  async create(payload: CourseWritePayload): Promise<CourseWithPrograms> {
    await this.ensureData();

    const languagePair = normalizeLanguagePair(payload.languagePair);
    const courseId = crypto.randomUUID();
    const programs = this.normalizePrograms(courseId, payload.programs);

    const course: Course = {
      id: courseId,
      title: payload.title,
      description: payload.description,
      authorId: this.userStore.user().id,
      languagePair,
      programIds: programs.map((p) => p.id),
      published: payload.published,
      updatedAt: new Date().toISOString(),
      authoring: normalizeCourseAuthoring(payload.authoring),
    };

    this.catalog = {
      courses: [...this.catalog!.courses, course],
      programs: [...(this.catalog!.programs ?? []), ...programs],
      lessons: [...(this.catalog!.lessons ?? [])],
    };
    this.persist();
    return { ...course, programs };
  }

  /**
   * Updates an existing course with the given payload.
   *
   * Verifies edit permissions and distinguishes between system-authored and
   * user-authored courses to apply the appropriate update logic.
   *
   * @param courseId - The unique identifier of the course to update.
   * @param payload - The updated course data.
   * @returns The updated `CourseWithPrograms` object.
   * @throws `HttpErrorResponse` with status 404 if not found, 403 if not authorised.
   */
  async update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms> {
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
      const programs = await this.programsWithLessonsForCourse(updated);

      this.catalog = {
        courses: this.catalog!.courses.map((item) => (item.id === courseId ? updated : item)),
        programs: this.catalog!.programs,
        lessons: this.catalog!.lessons,
      };
      this.persist();
      return { ...updated, programs };
    }

    const programs = this.normalizePrograms(courseId, payload.programs);

    const updated: Course = {
      ...current,
      title: payload.title,
      description: payload.description,
      published: payload.published,
      languagePair,
      programIds: programs.map((p) => p.id),
      updatedAt: new Date().toISOString(),
      authoring: normalizeCourseAuthoring(payload.authoring ?? current.authoring),
    };

    this.catalog = {
      courses: this.catalog!.courses.map((item) => (item.id === courseId ? updated : item)),
      programs: programs,
      lessons: this.catalog!.lessons,
    };
    this.persist();
    return { ...updated, programs };
  }

  /**
   * Deletes a course and its associated programs and lessons.
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
      programs: this.catalog!.programs?.filter((p) => p.courseId !== courseId) ?? [],
      lessons: this.catalog!.lessons?.filter((l) => {
        const program = this.catalog!.programs?.find((p) => p.id === l.programId);
        return !program || program.courseId !== courseId;
      }) ?? [],
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

    return this.catalog!.courses
      .filter((course) => {
        const programs = this.catalog!.programs?.filter((p) => p.courseId === course.id) ?? [];
        for (const program of programs) {
          const lessons = this.catalog!.lessons?.filter((l) => l.programId === program.id) ?? [];
          if (lessons.some((lesson) => lesson.scenarioIds.includes(scenarioId))) {
            return true;
          }
        }
        return false;
      })
      .map((course) =>
        courseToIndexEntry(
          course,
          this.catalog!.programs?.filter((p) => p.courseId === course.id).length ?? 0,
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

  // ── Program operations ──

  async getProgramById(programId: string): Promise<ProgramWithLessons> {
    await this.ensureData();
    const program = this.catalog!.programs?.find((p) => p.id === programId);
    if (!program) {
      throw notFound(`Program '${programId}' not found`);
    }
    const lessons = (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === programId)
      .sort((left, right) => left.order - right.order);
    return { ...program, lessons };
  }

  async createProgram(payload: ProgramWritePayload): Promise<ProgramWithLessons> {
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
    const lessons = (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === id)
      .sort((left, right) => left.order - right.order);
    return { ...newProgram, lessons };
  }

  async updateProgram(programId: string, payload: ProgramWritePayload): Promise<ProgramWithLessons> {
    await this.ensureData();
    const idx = this.catalog!.programs?.findIndex((p) => p.id === programId);
    if (idx === undefined || idx === -1) {
      throw notFound(`Program '${programId}' not found`);
    }
    const existing = this.catalog!.programs![idx];
    const updated: Program = {
      ...existing,
      title: payload.title,
      description: payload.description,
      lessonIds: payload.lessonIds,
      order: payload.order,
      updatedAt: new Date().toISOString(),
    };
    this.catalog!.programs![idx] = updated;
    this.persist();
    const lessons = (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === programId)
      .sort((left, right) => left.order - right.order);
    return { ...updated, lessons };
  }

  async deleteProgram(programId: string): Promise<void> {
    await this.ensureData();
    const idx = this.catalog!.programs?.findIndex((p) => p.id === programId);
    if (idx === undefined || idx === -1) {
      throw notFound(`Program '${programId}' not found`);
    }
    this.catalog!.programs!.splice(idx, 1);
    this.persist();
  }

  async getLessons(programId: string): Promise<readonly Lesson[]> {
    await this.ensureData();
    return (this.catalog!.lessons ?? [])
      .filter((lesson) => lesson.programId === programId)
      .sort((left, right) => left.order - right.order);
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

  private async programsWithLessonsForCourse(course: Course): Promise<ProgramWithLessons[]> {
    const programs = this.catalog!.programs?.filter((p) => course.programIds.includes(p.id)) ?? [];
    const results: ProgramWithLessons[] = [];

    for (const program of programs) {
      const lessons = (this.catalog!.lessons ?? [])
        .filter((lesson) => lesson.programId === program.id)
        .sort((left, right) => left.order - right.order);
      results.push({ ...program, lessons });
    }

    return results;
  }

  private normalizePrograms(
    courseId: string,
    drafts: CourseWritePayload['programs'],
  ): ProgramWithLessons[] {
    return drafts.map((draft, pIndex) => {
      const programId = draft.id ?? crypto.randomUUID();
      const lessons = (draft.lessons ?? []).map((lessonDraft: import('../../repository/course-catalog.port').LessonWritePayload, lIndex: number) => ({
        id: lessonDraft.id ?? crypto.randomUUID(),
        programId,
        title: lessonDraft.title,
        description: lessonDraft.description,
        scenarioIds: [...new Set(lessonDraft.scenarioIds.filter(Boolean))],
        prerequisiteLessonIds: [...new Set((lessonDraft.prerequisiteLessonIds ?? []).filter(Boolean))],
        order: lessonDraft.order ?? lIndex,
        updatedAt: new Date().toISOString(),
      }));

      return {
        id: programId,
        courseId,
        title: draft.title,
        description: draft.description,
        lessonIds: lessons.map((l) => l.id),
        order: draft.order ?? pIndex,
        updatedAt: new Date().toISOString(),
        lessons,
      };
    });
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
