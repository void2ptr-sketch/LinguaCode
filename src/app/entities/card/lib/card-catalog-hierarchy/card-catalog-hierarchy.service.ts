import { Injectable, inject, signal } from '@angular/core';

import type { CourseIndexEntry } from '../../../course/model';
import type { Lesson } from '../../../course/model/lesson.types';
import { CourseSearchService } from '../../../course/search/course-search.service';
import type { ContentLanguage } from '../../model';
/**
 * A course option for dropdown/select UI components.
 *
 * @remarks
 * Contains only `id` and `title` — used in hierarchy selectors.
 */
export type CourseOption = {
  id: string;
  title: string;
};

/**
 * A lesson option for dropdown/select UI components.
 *
 * @remarks
 * Contains only `id` and `title` — used in hierarchy selectors.
 */
export type LessonOption = {
  id: string;
  title: string;
};

/**
 * A scenario option for dropdown/select UI components.
 *
 * @remarks
 * Contains only `id` and `title` — used in hierarchy selectors.
 */
export type ScenarioOption = {
  id: string;
  title: string;
};

/**
 * Service for managing course/program/lesson/scenario hierarchy in the card catalog.
 *
 * @remarks
 * Loads courses by language pair, programs by course, lessons by program, and provides scenario
 * lookup for lessons. Uses internal caches to avoid redundant API calls.
 */
@Injectable({ providedIn: 'root' })
export class CardCatalogHierarchyService {
  private readonly courseSearchService = inject(CourseSearchService);

  /**
   * Whether courses are currently being loaded from the server.
   *
   * @remarks
   * Set to `true` at the start of `loadCourses` and reset to `false` when
   * the operation completes (success or error).
   */
  readonly coursesLoading = signal(false);

  /**
   * Whether lessons are currently being loaded from the server.
   *
   * @remarks
   * Set to `true` at the start of `loadLessons` and reset to `false` when
   * the operation completes (success or error).
   */
  readonly lessonsLoading = signal(false);

  /**
   * Whether programs are currently being loaded from the server.
   *
   * @remarks
   * Set to `true` at the start of `loadPrograms` and reset to `false` when
   * the operation completes (success or error).
   */
  readonly programsLoading = signal(false);

  private coursesCache = new Map<string, readonly CourseOption[]>();
  private courseProgramsCache = new Map<string, readonly import('../../../program/model/program.types').Program[]>();
  private programLessonsCache = new Map<string, readonly Lesson[]>();

  /**
   * Loads courses for a given language pair.
   *
   * @param known - The known content language.
   * @param learning - The learning content language.
   * @param languagePairKey - Cache key for the language pair.
   * @returns Array of course options.
   */
  async loadCourses(
    known: ContentLanguage,
    learning: ContentLanguage,
    languagePairKey: string,
  ): Promise<readonly CourseOption[]> {
    const cached = this.coursesCache.get(languagePairKey);
    if (cached) {
      return cached;
    }

    this.coursesLoading.set(true);

    try {
      const page = await this.courseSearchService.search({
        knownLanguage: known,
        learningLanguage: learning,
        scope: 'published',
        page: { page: 0, pageSize: 100 },
      });

      const courses = page.items.map(toCourseOption);
      this.coursesCache.set(languagePairKey, courses);
      return courses;
    } finally {
      this.coursesLoading.set(false);
    }
  }

  /**
   * Loads program options for a given course.
   *
   * @param courseId - The course ID.
   * @returns Array of program options.
   */
  async loadPrograms(courseId: string): Promise<readonly import('../../../program/model/program.types').Program[]> {
    const cached = this.courseProgramsCache.get(courseId);
    if (cached) {
      return cached;
    }

    this.programsLoading.set(true);

    try {
      const course = await this.courseSearchService.getById(courseId);
      const programs = (course as unknown as { programs: import('../../../program/model/program.types').Program[] }).programs ?? [];
      this.courseProgramsCache.set(courseId, programs);
      return programs;
    } finally {
      this.programsLoading.set(false);
    }
  }

  /**
   * Loads lesson options for a given program.
   *
   * @param programId - The program ID.
   * @returns Array of lesson options.
   */
  async loadLessons(programId: string): Promise<readonly LessonOption[]> {
    const cached = this.programLessonsCache.get(programId);
    if (cached) {
      return cached.map(toLessonOption);
    }

    this.lessonsLoading.set(true);

    try {
      const program = await this.courseSearchService.getProgramById(programId);
      this.programLessonsCache.set(programId, program.lessons);
      return program.lessons.map(toLessonOption);
    } finally {
      this.lessonsLoading.set(false);
    }
  }

  /**
   * Returns scenario options for a given lesson within a program.
   *
   * @param programId - The program ID.
   * @param lessonId - The lesson ID.
   * @returns Array of scenario options (IDs as titles until full data is loaded).
   */
  getScenariosForLesson(programId: string, lessonId: string): readonly ScenarioOption[] {
    const cached = this.programLessonsCache.get(programId);
    if (!cached) {
      return [];
    }

    const lesson = cached.find((l) => l.id === lessonId);
    if (!lesson) {
      return [];
    }

    return lesson.scenarioIds.map((id) => ({ id, title: id }));
  }

  /**
   * Invalidates cached data.
   *
   * @param languagePairKey - If provided, invalidates only the courses cache for this key.
   *   Otherwise clears all caches.
   */
  invalidateCache(languagePairKey?: string): void {
    if (languagePairKey) {
      this.coursesCache.delete(languagePairKey);
    } else {
      this.coursesCache.clear();
      this.courseProgramsCache.clear();
      this.programLessonsCache.clear();
    }
  }
}

function toCourseOption(entry: CourseIndexEntry): CourseOption {
  return { id: entry.id, title: entry.title };
}

function toLessonOption(lesson: Lesson): LessonOption {
  return { id: lesson.id, title: lesson.title };
}
