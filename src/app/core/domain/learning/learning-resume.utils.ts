import {
  buildLessonsById,
  isLessonCompleted,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from '../lesson/lesson-prerequisites.utils';
import { languagePairsEqual } from '../language-pair/language-pair.utils';
import { scenarioDisplayLabel } from '../../repositories/scenarios/utils/scenario-display-label.utils';
import type { LearningSessionPreferences } from '../../models';
import type { Course, CourseWithLessons, LanguagePair, LearningResult, Lesson } from '../../models';

/**
 * Describes the kind of learning resume action available to the user.
 */
export type LearningResumeKind = 'no-program' | 'start' | 'continue' | 'course-complete';

/**
 * Represents the target lesson and scenario to navigate to when resuming a learning session.
 */
export type LearningResumeTarget = {
  kind: LearningResumeKind;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  scenarioId: string;
  scenarioTitle: string;
};

/**
 * A single item in a lesson roadmap, showing progress and prerequisite state.
 */
export type LessonRoadmapItem = {
  lessonId: string;
  title: string;
  order: number;
  unlocked: boolean;
  completed: boolean;
  scenarioCount: number;
  completedScenarios: number;
  blockReason: string | null;
};

/**
 * Context required to compute the learning resume target for a given course.
 */
export type LearningResumeContext = {
  course: CourseWithLessons;
  saved?: LearningSessionPreferences;
  pairResults: readonly LearningResult[];
  hasScenarioResult: (scenarioId: string) => boolean;
  scenarioTitles?: Readonly<Record<string, string>>;
};

/**
 * Determines the active course ID from saved session preferences, learning results, or the course itself.
 *
 * Checks saved preferences first, then falls back to the most recently answered result,
 * and finally to the provided course object.
 *
 * @param saved — Saved learning session preferences.
 * @param pairResults — Learning results across all language pairs.
 * @param course — Current course, possibly `null`.
 * @returns The active course ID, or `null` if none can be determined.
 */
export function inferActiveCourseId(
  saved: LearningSessionPreferences | undefined,
  pairResults: readonly LearningResult[],
  course: CourseWithLessons | null,
): string | null {
  if (saved?.activeCourseId) {
    return saved.activeCourseId;
  }

  const sorted = [...pairResults].sort((left, right) =>
    right.answeredAt.localeCompare(left.answeredAt),
  );
  const fromResults = sorted.find((item) => item.courseId)?.courseId;
  if (fromResults) {
    return fromResults;
  }

  return course?.id ?? null;
}

/**
 * Checks whether the given course's language pair matches the specified language pair.
 *
 * @param course — Course whose language pair to check.
 * @param pair — Target language pair to compare against.
 * @returns `true` if the course language pair matches.
 */
export function courseMatchesActiveLanguagePair(
  course: Pick<Course, 'languagePair'>,
  pair: LanguagePair,
): boolean {
  return languagePairsEqual(course.languagePair, pair);
}

/**
 * Builds a roadmap of lessons with progress and prerequisite information.
 *
 * Lessons are sorted by order and enriched with unlock status, completion status,
 * scenario counts, and any prerequisite block reason.
 *
 * @param lessons — Lessons to process.
 * @param hasScenarioResult — Predicate that returns `true` when a scenario has been completed.
 * @returns Sorted array of lesson roadmap items.
 */
export function buildLessonRoadmap(
  lessons: readonly Lesson[],
  hasScenarioResult: (scenarioId: string) => boolean,
): readonly LessonRoadmapItem[] {
  const sorted = [...lessons].sort((left, right) => left.order - right.order);
  const lessonsById = buildLessonsById(sorted);

  return sorted.map((lesson) => {
    const completedScenarios = lesson.scenarioIds.filter((scenarioId) =>
      hasScenarioResult(scenarioId),
    ).length;

    return {
      lessonId: lesson.id,
      title: lesson.title,
      order: lesson.order,
      unlocked: isLessonUnlocked(lesson, lessonsById, hasScenarioResult),
      completed: isLessonCompleted(lesson, hasScenarioResult),
      scenarioCount: lesson.scenarioIds.length,
      completedScenarios,
      blockReason: prerequisiteBlockReason(lesson, sorted, hasScenarioResult),
    };
  });
}

/**
 * Resolves the next lesson and scenario target for resuming a learning session.
 *
 * Returns the first unlocked, incomplete scenario. If all scenarios are complete,
 * returns a `'course-complete'` target. Returns `'no-program'` when the course has no lessons.
 *
 * @param context — Learning resume context containing course, results, and helpers.
 * @returns The resolved resume target, or `null` if no target can be determined.
 */
export function resolveLearningResumeTarget(
  context: LearningResumeContext,
): LearningResumeTarget | null {
  const { course, hasScenarioResult, scenarioTitles, pairResults } = context;
  const lessons = [...course.lessons].sort((left, right) => left.order - right.order);

  if (lessons.length === 0) {
    return {
      kind: 'no-program',
      courseId: course.id,
      courseTitle: course.title,
      lessonId: '',
      lessonTitle: '',
      scenarioId: '',
      scenarioTitle: '',
    };
  }

  const lessonsById = buildLessonsById(lessons);
  const hasAnyResult =
    pairResults.some((item) => item.courseId === course.id) ||
    lessons.some((item) => item.scenarioIds.some((id) => hasScenarioResult(id)));

  for (const lesson of lessons) {
    if (!isLessonUnlocked(lesson, lessonsById, hasScenarioResult)) {
      continue;
    }

    for (const scenarioId of lesson.scenarioIds) {
      if (!hasScenarioResult(scenarioId)) {
        return {
          kind: hasAnyResult ? 'continue' : 'start',
          courseId: course.id,
          courseTitle: course.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          scenarioId,
          scenarioTitle: scenarioDisplayLabel(scenarioId, scenarioTitles?.[scenarioId]),
        };
      }
    }
  }

  const firstLesson = lessons.find((lesson) =>
    isLessonUnlocked(lesson, lessonsById, hasScenarioResult),
  );
  const firstScenarioId = firstLesson?.scenarioIds[0] ?? '';

  return {
    kind: 'course-complete',
    courseId: course.id,
    courseTitle: course.title,
    lessonId: firstLesson?.id ?? '',
    lessonTitle: firstLesson?.title ?? '',
    scenarioId: firstScenarioId,
    scenarioTitle: scenarioDisplayLabel(firstScenarioId, scenarioTitles?.[firstScenarioId]),
  };
}

/**
 * Collects all unique scenario IDs from the lessons of a course.
 *
 * @param course — Course whose lesson scenarios to collect.
 * @returns Array of unique scenario IDs.
 */
export function collectScenarioIds(course: CourseWithLessons): readonly string[] {
  return [...new Set(course.lessons.flatMap((lesson) => lesson.scenarioIds))];
}
