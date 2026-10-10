import { Injectable, inject, signal } from '@angular/core';

import type { CourseIndexEntry, CourseWithLessons, Lesson } from '../../../../core/models';
import { CourseSearchService } from '../../../../core/repositories/courses/course-search.service';
import type { ContentLanguage } from '../../../../core/models/card-index.types';

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
 * Service for managing course/lesson/scenario hierarchy in the card catalog.
 *
 * @remarks
 * Loads courses by language pair, lessons by course, and provides scenario
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

  private coursesCache = new Map<string, readonly CourseOption[]>();
  private courseLessonsCache = new Map<string, CourseWithLessons>();

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
   * Loads lessons for a given course.
   *
   * @param courseId - The course ID.
   * @returns Array of lesson options.
   */
  async loadLessons(courseId: string): Promise<readonly LessonOption[]> {
    const cached = this.courseLessonsCache.get(courseId);
    if (cached) {
      return cached.lessons.map(toLessonOption);
    }

    this.lessonsLoading.set(true);

    try {
      const course = await this.courseSearchService.getById(courseId);
      this.courseLessonsCache.set(courseId, course);
      return course.lessons.map(toLessonOption);
    } finally {
      this.lessonsLoading.set(false);
    }
  }

  /**
   * Returns scenario options for a given lesson within a course.
   *
   * @param courseId - The course ID.
   * @param lessonId - The lesson ID.
   * @returns Array of scenario options (IDs as titles until full data is loaded).
   */
  getScenariosForLesson(courseId: string, lessonId: string): readonly ScenarioOption[] {
    const course = this.courseLessonsCache.get(courseId);
    if (!course) {
      return [];
    }

    const lesson = course.lessons.find((l) => l.id === lessonId);
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
      this.courseLessonsCache.clear();
    }
  }
}

function toCourseOption(entry: CourseIndexEntry): CourseOption {
  return { id: entry.id, title: entry.title };
}

function toLessonOption(lesson: Lesson): LessonOption {
  return { id: lesson.id, title: lesson.title };
}
