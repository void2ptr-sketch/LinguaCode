import type { LearningResumeTarget } from '../../../core/data/learning-resume.utils';

export type ContinueLinkQueryParams = {
  courseId: string;
  lessonId: string;
  scenarioId: string;
  tab: 'learning';
};

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
