import type { Course, Lesson } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

import { normalizeLanguagePair } from './language-pair.utils';
import {
  DEFAULT_RADICALS_COURSE,
  DEFAULT_RADICALS_LESSONS,
  isObsoleteRadicalsCatalogItem,
} from './radicals-course.defaults';
import { RU_ZH_LANGUAGE_PAIR } from './scenario-catalog.defaults';

export const COURSE_CATALOG_STORAGE_KEY = 'lingua-code.course-catalog';

export type CourseCatalogState = {
  courses: Course[];
  lessons: Lesson[];
};

export const DEFAULT_EN_COURSE_CATALOG: CourseCatalogState = {
  courses: [
    {
      id: 'demo-course',
      title: 'Демо: базовый English',
      description: 'Вводная учебная программа для курса ru→en.',
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

export const DEFAULT_ZH_COURSE_CATALOG: CourseCatalogState = {
  courses: [
    {
      id: 'course-zh-a1',
      title: 'Китайский A1: первые шаги',
      description: 'Базовая программа для курса ru→zh: приветствия, фонетика и иероглифы.',
      authorId: 'local-user',
      languagePair: RU_ZH_LANGUAGE_PAIR,
      lessonIds: ['lesson-zh-greetings', 'lesson-zh-phonetics', 'lesson-zh-characters'],
      published: true,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'course-zh-conversation',
      title: 'Китайский: разговорная практика',
      description: 'Короткий курс для закрепления приветствий и смешанных упражнений.',
      authorId: 'local-user',
      languagePair: RU_ZH_LANGUAGE_PAIR,
      lessonIds: ['lesson-zh-quick-start', 'lesson-zh-review'],
      published: true,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    DEFAULT_RADICALS_COURSE,
  ],
  lessons: [
    {
      id: 'lesson-zh-greetings',
      courseId: 'course-zh-a1',
      title: 'Урок 1: Приветствия',
      description: '你好, 谢谢, 再见 — узнавание и сопоставление.',
      scenarioIds: ['scenario-zh-greetings'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'lesson-zh-phonetics',
      courseId: 'course-zh-a1',
      title: 'Урок 2: Пиньинь и тоны',
      description: 'Ввод пиньинь, IPA и выбор тона.',
      scenarioIds: ['scenario-zh-phonetics'],
      prerequisiteLessonIds: ['lesson-zh-greetings'],
      order: 1,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'lesson-zh-characters',
      courseId: 'course-zh-a1',
      title: 'Урок 3: Иероглифы',
      description: 'Черты, радикалы и чтение 行.',
      scenarioIds: ['scenario-zh-characters'],
      prerequisiteLessonIds: ['lesson-zh-phonetics'],
      order: 2,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'lesson-zh-quick-start',
      courseId: 'course-zh-conversation',
      title: 'Быстрый старт',
      description: 'Первые фразы и базовые упражнения.',
      scenarioIds: ['scenario-zh-greetings'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      id: 'lesson-zh-review',
      courseId: 'course-zh-conversation',
      title: 'Закрепление',
      description: 'Смешанная практика после быстрого старта.',
      scenarioIds: ['scenario-zh-review'],
      prerequisiteLessonIds: ['lesson-zh-quick-start'],
      order: 1,
      updatedAt: '2026-06-14T10:00:00.000Z',
    },
    ...DEFAULT_RADICALS_LESSONS,
  ],
};

export const DEFAULT_COURSE_CATALOG: CourseCatalogState = {
  courses: [...DEFAULT_EN_COURSE_CATALOG.courses, ...DEFAULT_ZH_COURSE_CATALOG.courses],
  lessons: [...DEFAULT_EN_COURSE_CATALOG.lessons, ...DEFAULT_ZH_COURSE_CATALOG.lessons],
};

export function mergeCourseCatalogWithDefaults(
  stored: CourseCatalogState,
  defaults: CourseCatalogState = DEFAULT_COURSE_CATALOG,
): CourseCatalogState {
  const coursesById = new Map<string, Course>();
  const lessonsById = new Map<string, Lesson>();

  for (const course of defaults.courses) {
    coursesById.set(course.id, course);
  }

  for (const lesson of defaults.lessons) {
    lessonsById.set(lesson.id, lesson);
  }

  for (const course of stored.courses) {
    if (isObsoleteRadicalsCatalogItem(course.id)) {
      continue;
    }

    const defaultCourse = coursesById.get(course.id);
    coursesById.set(course.id, mergeStoredCourse(course, defaultCourse));
  }

  for (const lesson of stored.lessons) {
    if (isObsoleteRadicalsCatalogItem(lesson.id)) {
      continue;
    }

    const defaultLesson = lessonsById.get(lesson.id);
    lessonsById.set(lesson.id, mergeStoredLesson(lesson, defaultLesson));
  }

  return {
    courses: [...coursesById.values()],
    lessons: [...lessonsById.values()],
  };
}

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

    const stored: CourseCatalogState = {
      courses: parsed.courses.filter(isCourse).map((course) => normalizeStoredCourse(course)),
      lessons: parsed.lessons.filter(isLesson).map(normalizeStoredLesson),
    };

    return cloneCatalog(mergeCourseCatalogWithDefaults(stored));
  } catch {
    return cloneCatalog(DEFAULT_COURSE_CATALOG);
  }
}

export function saveCourseCatalogToStorage(catalog: CourseCatalogState): void {
  localStorage.setItem(COURSE_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
}

function cloneCatalog(catalog: CourseCatalogState): CourseCatalogState {
  return {
    courses: catalog.courses.map((course) => normalizeStoredCourse(course)),
    lessons: catalog.lessons.map((lesson) => normalizeStoredLesson(lesson)),
  };
}

function normalizeStoredCourse(course: Course): Course {
  return {
    ...course,
    description: course.description ?? '',
    authorId: course.authorId ?? 'local-user',
    languagePair: normalizeLanguagePair(course.languagePair),
    lessonIds: [...course.lessonIds],
    published: course.published ?? false,
    updatedAt: course.updatedAt ?? new Date(0).toISOString(),
  };
}

function mergeStoredCourse(stored: Course, defaultCourse?: Course): Course {
  if (!defaultCourse) {
    return normalizeStoredCourse(stored);
  }

  return normalizeStoredCourse({
    ...defaultCourse,
    ...stored,
    languagePair: defaultCourse.languagePair,
    lessonIds: stored.lessonIds.length > 0 ? stored.lessonIds : defaultCourse.lessonIds,
  });
}

function mergeStoredLesson(stored: Lesson, defaultLesson?: Lesson): Lesson {
  if (!defaultLesson) {
    return normalizeStoredLesson(stored);
  }

  return normalizeStoredLesson({
    ...defaultLesson,
    ...stored,
    scenarioIds:
      stored.scenarioIds.length > 0 ? stored.scenarioIds : defaultLesson.scenarioIds,
    prerequisiteLessonIds:
      stored.prerequisiteLessonIds.length > 0
        ? stored.prerequisiteLessonIds
        : defaultLesson.prerequisiteLessonIds,
  });
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
