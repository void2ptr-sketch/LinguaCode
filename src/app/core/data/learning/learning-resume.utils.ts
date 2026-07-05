import {
  buildLessonsById,
  isLessonCompleted,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from '../lesson/lesson-prerequisites.utils';
import { languagePairsEqual } from '../language-pair/language-pair.utils';
import { scenarioDisplayLabel } from '../scenarios/scenario-display-label.utils';
import type { LearningSessionPreferences } from '../../models/learning-session.types';
import type { Course, CourseWithLessons, LanguagePair, LearningResult, Lesson } from '../../models';

export type LearningResumeKind = 'no-program' | 'start' | 'continue' | 'course-complete';

export type LearningResumeTarget = {
  kind: LearningResumeKind;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  scenarioId: string;
  scenarioTitle: string;
};

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

export type LearningResumeContext = {
  course: CourseWithLessons;
  saved?: LearningSessionPreferences;
  pairResults: readonly LearningResult[];
  hasScenarioResult: (scenarioId: string) => boolean;
  scenarioTitles?: Readonly<Record<string, string>>;
};

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

export function courseMatchesActiveLanguagePair(
  course: Pick<Course, 'languagePair'>,
  pair: LanguagePair,
): boolean {
  return languagePairsEqual(course.languagePair, pair);
}

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

export function collectScenarioIds(course: CourseWithLessons): readonly string[] {
  return [...new Set(course.lessons.flatMap((lesson) => lesson.scenarioIds))];
}
