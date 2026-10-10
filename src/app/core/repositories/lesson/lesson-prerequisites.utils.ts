import type { Lesson } from '../../models';

/**
 * Minimal lesson shape used for progress checks.
 *
 * @remarks
 * Contains only the fields needed to determine lesson completion status.
 */
export type LessonProgressCheck = Pick<Lesson, 'id' | 'scenarioIds'>;

/**
 * Checks whether all scenarios in a lesson have been completed.
 *
 * @param lesson - The lesson to check.
 * @param hasScenarioResult - Function that returns `true` if a scenario has a result.
 * @returns `true` if all scenario IDs have results; `false` if the lesson has no scenarios.
 */
export function isLessonCompleted(
  lesson: LessonProgressCheck,
  hasScenarioResult: (scenarioId: string) => boolean,
): boolean {
  if (lesson.scenarioIds.length === 0) {
    return false;
  }

  return lesson.scenarioIds.every((scenarioId) => hasScenarioResult(scenarioId));
}

/**
 * Checks whether a lesson is unlocked (all prerequisites completed).
 *
 * @param lesson - The lesson to check.
 * @param lessonsById - Map of all lessons by ID.
 * @param hasScenarioResult - Function that returns `true` if a scenario has a result.
 * @returns `true` if all prerequisites are completed (or there are none).
 */
export function isLessonUnlocked(
  lesson: Pick<Lesson, 'id' | 'prerequisiteLessonIds'>,
  lessonsById: ReadonlyMap<string, LessonProgressCheck>,
  hasScenarioResult: (scenarioId: string) => boolean,
): boolean {
  const prerequisites = lesson.prerequisiteLessonIds ?? [];

  for (const prerequisiteId of prerequisites) {
    const prerequisite = lessonsById.get(prerequisiteId);
    if (!prerequisite || !isLessonCompleted(prerequisite, hasScenarioResult)) {
      return false;
    }
  }

  return true;
}

/**
 * Builds a Map of lessons indexed by their ID.
 *
 * @param lessons - Array of lessons to index.
 * @returns A Map with lesson IDs as keys.
 */
export function buildLessonsById(
  lessons: readonly LessonProgressCheck[],
): Map<string, LessonProgressCheck> {
  return new Map(lessons.map((lesson) => [lesson.id, lesson]));
}

/**
 * Returns a human-readable reason why a lesson is locked.
 *
 * @param lesson - The lesson to check.
 * @param lessons - Array of all lessons (for title lookup).
 * @param hasScenarioResult - Function that returns `true` if a scenario has a result.
 * @returns A localized error message describing the blocking prerequisite, or `null` if the lesson is unlocked.
 */
export function prerequisiteBlockReason(
  lesson: Pick<Lesson, 'prerequisiteLessonIds'>,
  lessons: readonly Pick<Lesson, 'id' | 'title' | 'scenarioIds'>[],
  hasScenarioResult: (scenarioId: string) => boolean,
): string | null {
  const lessonsById = buildLessonsById(lessons);
  const prerequisites = lesson.prerequisiteLessonIds ?? [];

  for (const prerequisiteId of prerequisites) {
    const prerequisite = lessonsById.get(prerequisiteId);
    if (!prerequisite || !isLessonCompleted(prerequisite, hasScenarioResult)) {
      const title = lessons.find((item) => item.id === prerequisiteId)?.title ?? prerequisiteId;
      return `Сначала завершите урок «${title}»`;
    }
  }

  return null;
}
