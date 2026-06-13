import type { Course, Lesson } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

export const COURSE_CATALOG_STORAGE_KEY = 'lingua-code.course-catalog';

export type CourseCatalogState = {
  courses: Course[];
  lessons: Lesson[];
};

export const DEFAULT_COURSE_CATALOG: CourseCatalogState = {
  courses: [
    {
      id: 'demo-course',
      title: 'Демо: базовый English',
      description: 'Вводный учебный курс для пары ru→en.',
      authorId: 'local-user',
      languagePair: DEFAULT_LANGUAGE_PAIR,
      lessonIds: ['demo-lesson-1', 'demo-lesson-2'],
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  lessons: [
    {
      id: 'demo-lesson-1',
      courseId: 'demo-course',
      title: 'Приветствия',
      description: 'Первые сценарии приветствия.',
      scenarioIds: ['demo-scenario'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'demo-lesson-2',
      courseId: 'demo-course',
      title: 'Повторение',
      description: 'Закрепление после первого урока.',
      scenarioIds: ['demo-scenario'],
      prerequisiteLessonIds: ['demo-lesson-1'],
      order: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

export function loadCourseCatalogFromStorage(): CourseCatalogState {
  const raw = localStorage.getItem(COURSE_CATALOG_STORAGE_KEY);
  if (!raw) {
    return cloneCatalog(DEFAULT_COURSE_CATALOG);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CourseCatalogState>;
    if (!Array.isArray(parsed.courses) || !Array.isArray(parsed.lessons)) {
      return cloneCatalog(DEFAULT_COURSE_CATALOG);
    }

    return {
      courses: parsed.courses.filter(isCourse),
      lessons: parsed.lessons.filter(isLesson).map(normalizeStoredLesson),
    };
  } catch {
    return cloneCatalog(DEFAULT_COURSE_CATALOG);
  }
}

export function saveCourseCatalogToStorage(catalog: CourseCatalogState): void {
  localStorage.setItem(COURSE_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
}

function cloneCatalog(catalog: CourseCatalogState): CourseCatalogState {
  return {
    courses: catalog.courses.map((course) => ({ ...course, lessonIds: [...course.lessonIds] })),
    lessons: catalog.lessons.map((lesson) => ({
      ...lesson,
      scenarioIds: [...lesson.scenarioIds],
      prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
    })),
  };
}

function isCourse(value: unknown): value is Course {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Course>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.lessonIds)
  );
}

function normalizeStoredLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    scenarioIds: [...lesson.scenarioIds],
    prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
  };
}

function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Lesson>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.courseId === 'string' &&
    Array.isArray(candidate.scenarioIds)
  );
}
