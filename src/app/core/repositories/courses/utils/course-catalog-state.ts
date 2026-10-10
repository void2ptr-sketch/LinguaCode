import type { Course, Lesson } from '../../../models';

import { normalizeLanguagePair } from '../../language-pair/language-pair.utils';
import { normalizeCourseAuthoring } from './course-authoring.utils';
import type { CoursesSeedFixture } from '../../content-seed/content-seed.types';

/**
 * Resolved course catalog containing the normalised list of courses and lessons.
 *
 * The catalog is built from the content seed and any user-provided overlay (edits / deletions).
 */
export type CourseCatalogState = {
  courses: Course[];
  lessons: Lesson[];
};

/**
 * Normalises a stored course by ensuring all fields have sensible defaults.
 *
 * Sets empty `description` to `''`, missing `authorId` to `'local-user'`, clones arrays,
 * defaults `published` to `false`, sets `updatedAt` to epoch if missing, and normalises
 * `languagePair` and `authoring`.
 */
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

/**
 * Normalises a stored lesson by cloning its array fields.
 *
 * @param lesson - The lesson to normalise.
 * @returns A new lesson object with cloned `scenarioIds` and `prerequisiteLessonIds` arrays.
 */
export function normalizeStoredLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    scenarioIds: [...lesson.scenarioIds],
    prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
  };
}

/**
 * Merges a stored course with a default course, giving priority to stored values.
 *
 * The `languagePair` always comes from the default course. Array fields (`lessonIds`) are taken
 * from the stored course when non-empty; otherwise the defaults are used.
 */
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

/**
 * Merges a stored lesson with a default lesson, giving priority to stored values.
 *
 * Array fields (`scenarioIds`, `prerequisiteLessonIds`) are taken from the stored lesson when
 * non-empty; otherwise the defaults are used.
 */
export function mergeStoredLesson(stored: Lesson, defaultLesson?: Lesson): Lesson {
  if (!defaultLesson) {
    return normalizeStoredLesson(stored);
  }

  return normalizeStoredLesson({
    ...defaultLesson,
    ...stored,
    scenarioIds: stored.scenarioIds.length > 0 ? stored.scenarioIds : defaultLesson.scenarioIds,
    prerequisiteLessonIds:
      stored.prerequisiteLessonIds.length > 0
        ? stored.prerequisiteLessonIds
        : defaultLesson.prerequisiteLessonIds,
  });
}

/**
 * Normalises a partial seed fixture into a `CourseCatalogState`.
 *
 * Filters out invalid entries using type guards and applies normalisation to every course and lesson.
 */
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

/**
 * Creates a deep clone of the course catalog by normalising every course and lesson.
 *
 * @param catalog - The catalog to clone.
 * @returns A new catalog with all courses and lessons normalised and arrays cloned.
 */
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
