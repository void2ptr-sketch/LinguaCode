import type { Course, Lesson } from '../models';

import { normalizeLanguagePair } from './language-pair.utils';
import { normalizeCourseAuthoring } from './course-authoring.utils';
import type { CoursesSeedFixture } from './content-seed.types';

export type CourseCatalogState = {
  courses: Course[];
  lessons: Lesson[];
};

export function normalizeStoredCourse(course: Course): Course {
  return {
    ...course,
    description: course.description ?? '',
    authorId: course.authorId ?? 'local-user',
    languagePair: normalizeLanguagePair(course.languagePair),
    lessonIds: [...course.lessonIds],
    published: course.published ?? false,
    updatedAt: course.updatedAt ?? new Date(0).toISOString(),
    authoring: normalizeCourseAuthoring(course.authoring),
  };
}

export function normalizeStoredLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    scenarioIds: [...lesson.scenarioIds],
    prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
  };
}

export function mergeStoredCourse(stored: Course, defaultCourse?: Course): Course {
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

export function mergeStoredLesson(stored: Lesson, defaultLesson?: Lesson): Lesson {
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

export function normalizeStoredCourseCatalog(
  catalog: Partial<CoursesSeedFixture>,
): CourseCatalogState {
  return {
    courses: Array.isArray(catalog.courses)
      ? catalog.courses.filter(isCourse).map((course) => normalizeStoredCourse(course))
      : [],
    lessons: Array.isArray(catalog.lessons)
      ? catalog.lessons.filter(isLesson).map((lesson) => normalizeStoredLesson(lesson))
      : [],
  };
}

export function cloneCourseCatalog(catalog: CourseCatalogState): CourseCatalogState {
  return {
    courses: catalog.courses.map((course) => normalizeStoredCourse(course)),
    lessons: catalog.lessons.map((lesson) => normalizeStoredLesson(lesson)),
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
