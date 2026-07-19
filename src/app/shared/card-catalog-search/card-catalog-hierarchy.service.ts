import { Injectable, inject, signal } from '@angular/core';

import type { CourseIndexEntry, CourseWithLessons, Lesson } from '../../core/models';
import { CourseSearchService } from '../../core/data/courses/course-search.service';
import type { ContentLanguage } from '../../core/models/card-index.types';

export type CourseOption = {
  id: string;
  title: string;
};

export type LessonOption = {
  id: string;
  title: string;
};

export type ScenarioOption = {
  id: string;
  title: string;
};

@Injectable({ providedIn: 'root' })
export class CardCatalogHierarchyService {
  private readonly courseSearchService = inject(CourseSearchService);

  readonly coursesLoading = signal(false);
  readonly lessonsLoading = signal(false);

  private coursesCache: readonly CourseOption[] | null = null;
  private courseLessonsCache = new Map<string, CourseWithLessons>();

  async loadCourses(known: ContentLanguage, learning: ContentLanguage): Promise<readonly CourseOption[]> {
    if (this.coursesCache) {
      return this.coursesCache;
    }

    this.coursesLoading.set(true);

    try {
      const page = await this.courseSearchService.search({
        knownLanguage: known,
        learningLanguage: learning,
        page: { page: 0, pageSize: 100 },
      });

      this.coursesCache = page.items.map(toCourseOption);
      return this.coursesCache;
    } finally {
      this.coursesLoading.set(false);
    }
  }

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

  getScenariosForLesson(courseId: string, lessonId: string): readonly ScenarioOption[] {
    const course = this.courseLessonsCache.get(courseId);
    if (!course) {
      return [];
    }

    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return [];
    }

    // Сценарии хранятся как массив ID в lesson.scenarioIds.
    // Возвращаем их как есть — полные данные сценариев будут загружены
    // при необходимости через ScenarioSearchService.
    return lesson.scenarioIds.map((id) => ({ id, title: id }));
  }

  invalidateCache(): void {
    this.coursesCache = null;
    this.courseLessonsCache.clear();
  }
}

function toCourseOption(entry: CourseIndexEntry): CourseOption {
  return { id: entry.id, title: entry.title };
}

function toLessonOption(lesson: Lesson): LessonOption {
  return { id: lesson.id, title: lesson.title };
}
