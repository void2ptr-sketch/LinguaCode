import type { Course, Lesson } from '../model';
import type { Program } from '../../program/model';
import type { Scenario } from '../../scenario/model';
import type { CourseAuthoring } from '../model/course-authoring.types';

import { normalizeLanguagePair } from '../../language-pair/lib/language-pair.utils';
import { normalizeCourseAuthoring } from './course-authoring.utils';
import type { CoursesNestedFixture, CoursesSeedFixture } from '../../content-seed/content-seed.types';

/**
 * Resolved course catalog containing the normalised list of courses, programs, and lessons.
 *
 * The catalog is built from the content seed and any user-provided overlay (edits / deletions).
 */
export type CourseCatalogState = {
  courses: Course[];
  programs: Program[];
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
    programIds: [...course.programIds],
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
 * Normalises a stored program by cloning its array fields.
 *
 * @param program - The program to normalise.
 * @returns A new program object with cloned `lessonIds` array.
 */
export function normalizeStoredProgram(program: Program): Program {
  return {
    ...program,
    lessonIds: [...(program.lessonIds ?? [])],
  };
}

/**
 * Merges a stored course with a default course, giving priority to stored values.
 *
 * The `languagePair` always comes from the default course. Array fields (`programIds`) are taken
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
    programIds: (stored.programIds?.length ?? 0) > 0 ? stored.programIds : defaultCourse.programIds,
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
 * Merges a stored program with a default program, giving priority to stored values.
 *
 * Array fields (`lessonIds`) are taken from the stored program when non-empty;
 * otherwise the defaults are used.
 */
export function mergeStoredProgram(stored: Program, defaultProgram?: Program): Program {
  if (!defaultProgram) {
    return normalizeStoredProgram(stored);
  }

  return normalizeStoredProgram({
    ...defaultProgram,
    ...stored,
    lessonIds: (stored.lessonIds?.length ?? 0) > 0 ? stored.lessonIds ?? [] : defaultProgram.lessonIds,
  });
}

/**
 * Normalises a partial seed fixture into a `CourseCatalogState`.
 *
 * Filters out invalid entries using type guards and applies normalisation to every course, program, and lesson.
 * Also migrates legacy format (courses with `lessonIds`, lessons with `courseId`) to the new format
 * (courses with `programIds`, programs with `lessonIds`, lessons with `programId`).
 */
export function normalizeStoredCourseCatalog(
  catalog: Partial<CoursesSeedFixture>,
): CourseCatalogState {
  // Migrate legacy format: courses with lessonIds → courses with programs
  // Deep clone to avoid mutating the original fixture objects across multiple calls
  const cloned = JSON.parse(JSON.stringify(catalog));
  const {
    courses,
    programs: existingPrograms,
    lessons,
  } = cloned as {
    courses?: unknown[];
    programs?: unknown[];
    lessons?: unknown[];
  };
  const migratedPrograms: Record<string, unknown>[] = [];
  const migratedLessons: Record<string, unknown>[] = [];

  if (Array.isArray(courses)) {
    for (const course of courses) {
      // Skip null/undefined course entries
      if (!course || typeof course !== 'object') {
        continue;
      }

      // Check if this is a legacy course (has lessonIds instead of programIds)
      const c = course as Record<string, unknown>;
      if (
        Array.isArray(c['lessonIds']) &&
        (!Array.isArray(c['programIds']) || (c['programIds'] as string[]).length === 0)
      ) {
        // Create a default program for this course
        const programId = `program-${c['id'] as string}`;
        migratedPrograms.push({
          id: programId,
          courseId: c['id'],
          title: c['title'],
          description: (c['description'] as string) ?? '',
          lessonIds: c['lessonIds'],
          order: 0,
          updatedAt: (c['updatedAt'] as string) ?? new Date().toISOString(),
        });

        // Update lessons to reference the program instead of the course
        if (Array.isArray(lessons)) {
          for (const lesson of lessons) {
            const l = lesson as Record<string, unknown>;
            if (l['courseId'] === c['id']) {
              migratedLessons.push({
                ...l,
                programId,
                courseId: undefined, // Remove legacy field
              });
            }
          }
        }

        // Update course to use programIds
        c['programIds'] = [programId];
        delete c['lessonIds'];
      }
    }
  }

  return {
    courses: Array.isArray(courses)
      ? courses.filter(isCourse).map((course) => normalizeStoredCourse(course))
      : [],
    programs: [
      ...(Array.isArray(existingPrograms)
        ? existingPrograms.filter(isProgram).map((program) => normalizeStoredProgram(program))
        : []),
      ...migratedPrograms.map((p) => normalizeStoredProgram(p as Program)),
    ],
    lessons: [
      ...(Array.isArray(lessons)
        ? lessons
            .filter((l) => !migratedLessons.find((ml) => ml['id'] === (l as Lesson).id))
            .filter(isLesson)
            .map((lesson) => normalizeStoredLesson(lesson as Lesson))
        : []),
      ...migratedLessons.map((l) => normalizeStoredLesson(l as Lesson)),
    ],
  };
}

/**
 * Creates a deep clone of the course catalog by normalising every course, program, and lesson.
 *
 * @param catalog - The catalog to clone.
 * @returns A new catalog with all courses, programs, and lessons normalised and arrays cloned.
 */
export function cloneCourseCatalog(catalog: CourseCatalogState): CourseCatalogState {
  return {
    courses: catalog.courses.map((course) => normalizeStoredCourse(course)),
    programs: catalog.programs.map((program) => normalizeStoredProgram(program)),
    lessons: catalog.lessons.map((lesson) => normalizeStoredLesson(lesson)),
  };
}

/**
 * Result of normalizing a nested course fixture.
 */
export type NestedCourseResult = {
  catalog: CourseCatalogState;
  cards: Card[];
};

import type { Card } from '../../card/model';

/**
 * Detects whether the catalog is in the new nested format.
 *
 * The nested format has a top-level `programs` array and no `courses` array.
 *
 * @param catalog - The catalog to check.
 * @returns `true` if the catalog uses the nested format.
 */
export function isNestedFormat(catalog: unknown): boolean {
  if (!catalog || typeof catalog !== 'object') return false;
  const obj = catalog as Record<string, unknown>;
  return Array.isArray(obj['programs']) && !Array.isArray(obj['courses']);
}

/**
 * Normalises a nested course fixture into a `CourseCatalogState` and extracts cards.
 *
 * Traverses `programs[] → lessons[] → scenarios[] → cards[]`, creates flat
 * `Course`, `Program`, `Lesson`, and `Scenario` objects, and collects all
 * inline cards into a flat array for the card seed cache.
 *
 * @param fixture - The nested course fixture to normalise.
 * @returns An object containing the normalised catalog and extracted cards.
 */
export function normalizeNestedCourseCatalog(
  fixture: CoursesNestedFixture,
): NestedCourseResult {
  const courses: Course[] = [];
  const programs: Program[] = [];
  const lessons: Lesson[] = [];
  const scenarios: Scenario[] = [];
  const allCards: Card[] = [];

  const courseId = fixture.id;

  // Create the course object
  courses.push({
    id: courseId,
    title: fixture.title,
    description: fixture.description ?? '',
    authorId: 'local-user',
    languagePair: normalizeLanguagePair(fixture.languagePair),
    programIds: [],
    published: fixture.published ?? false,
    updatedAt: fixture.updatedAt ?? new Date(0).toISOString(),
    authoring: normalizeCourseAuthoring(fixture.authoring as CourseAuthoring | undefined),
    practiceSettings: fixture.practiceSettings as Course['practiceSettings'],
  });

  for (const program of fixture.programs) {
    const programObj: Program = {
      id: program.id,
      courseId,
      title: program.title,
      description: program.description ?? '',
      lessonIds: [],
      order: program.order,
      updatedAt: new Date(0).toISOString(),
    };
    programs.push(programObj);

    const programLessonIds: string[] = [];

    for (const lesson of program.lessons) {
      const lessonObj: Lesson = {
        id: lesson.id,
        programId: program.id,
        title: lesson.title,
        description: lesson.description ?? '',
        scenarioIds: [],
        prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
        order: lesson.order,
        updatedAt: new Date(0).toISOString(),
      };
      lessons.push(lessonObj);

      const lessonScenarioIds: string[] = [];

      for (const scenario of lesson.scenarios) {
        // Collect cards from inline cards[]
        const cardIds: string[] = [];
        if (Array.isArray(scenario.cards) && scenario.cards.length > 0) {
          for (const card of scenario.cards) {
            allCards.push({
              ...card,
              courseId,
              lessonId: lesson.id,
              scenarioId: scenario.id,
            });
            cardIds.push(card.id);
          }
        }

        // Fallback to _cardIds when cards[] is empty
        if (cardIds.length === 0 && Array.isArray(scenario._cardIds)) {
          for (const cardId of scenario._cardIds) {
            cardIds.push(cardId);
          }
        }

        const scenarioObj: Scenario = {
          id: scenario.id,
          title: scenario.title,
          description: scenario.description ?? '',
          authorId: 'local-user',
          cardSource: {
            mode: 'fixed' as const,
            cardIds,
          },
          published: scenario.published ?? false,
          updatedAt: new Date(0).toISOString(),
          languagePair: scenario.languagePair
            ? normalizeLanguagePair(scenario.languagePair)
            : undefined,
          courseId,
        };
        scenarios.push(scenarioObj);
        lessonScenarioIds.push(scenario.id);
      }

      lessonObj.scenarioIds = lessonScenarioIds;
      programLessonIds.push(lesson.id);
    }

    programObj.lessonIds = programLessonIds;
  }

  // Update course programIds
  courses[0].programIds = programs.map((p) => p.id);

  return {
    catalog: { courses, programs, lessons },
    cards: allCards,
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
    Array.isArray(candidate.programIds)
  );
}

function isProgram(value: unknown): value is Program {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Program>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.courseId === 'string' &&
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
    typeof candidate.programId === 'string' &&
    Array.isArray(candidate.scenarioIds)
  );
}
