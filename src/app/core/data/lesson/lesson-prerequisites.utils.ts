import type { Lesson } from '../../models';

export type LessonProgressCheck = Pick<Lesson, 'id' | 'scenarioIds'>;

export function isLessonCompleted(
  lesson: LessonProgressCheck,
  hasScenarioResult: (scenarioId: string) => boolean,
): boolean {
  if (lesson.scenarioIds.length === 0) {
    return false;
  }

  return lesson.scenarioIds.every((scenarioId) => hasScenarioResult(scenarioId));
}

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

export function buildLessonsById(
  lessons: readonly LessonProgressCheck[],
): Map<string, LessonProgressCheck> {
  return new Map(lessons.map((lesson) => [lesson.id, lesson]));
}

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
