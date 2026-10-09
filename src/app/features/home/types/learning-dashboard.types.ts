import type { LearningResumeTarget } from '../../../core/data/learning/learning-resume.utils';

/**
 * Query parameters for the "continue learning" link on the home page.
 *
 * @remarks
 * Encodes the resume target into URL query params for deep-linking.
 */
export type ContinueLinkQueryParams = {
  courseId: string;
  lessonId: string;
  scenarioId: string;
  tab: 'learning';
};

/**
 * Builds query parameters for the continue learning link from a resume target.
 *
 * @param target - The learning resume target.
 * @returns Query parameters object, or `null` if no valid target exists.
 */
export function buildContinueLinkQueryParams(
  target: LearningResumeTarget | null,
): ContinueLinkQueryParams | null {
  if (!target || !target.scenarioId || target.kind === 'no-program') {
    return null;
  }

  return {
    courseId: target.courseId,
    lessonId: target.lessonId,
    scenarioId: target.scenarioId,
    tab: 'learning',
  };
}

/**
 * Returns a human-readable label for the continue button based on the resume target.
 *
 * @param target - The learning resume target.
 * @returns A localized label string such as "Continue: Lesson · Scenario" or "Start: Lesson".
 */
export function continueButtonLabel(target: LearningResumeTarget | null): string {
  if (!target || target.kind === 'no-program') {
    return 'Выбрать программу';
  }

  if (target.kind === 'course-complete') {
    return `Повторить: ${target.courseTitle}`;
  }

  if (target.kind === 'start') {
    return `Начать: ${target.lessonTitle}`;
  }

  return `Продолжить: ${target.lessonTitle} · ${target.scenarioTitle}`;
}
