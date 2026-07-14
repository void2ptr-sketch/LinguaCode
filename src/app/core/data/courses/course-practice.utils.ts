import type { CardDifficulty, CardIndexEntry } from '../../models/card-index.types';
import {
  DEFAULT_COURSE_PRACTICE_SETTINGS,
  type CoursePracticeSettings,
} from '../../models/course-practice.types';
import type { Course, CourseWithLessons } from '../../models/course.types';
import type { Scenario } from '../../models/scenario.types';

export function resolveCoursePracticeSettings(
  course: Pick<Course, 'practiceSettings'> | null | undefined,
): CoursePracticeSettings {
  if (!course?.practiceSettings) {
    return DEFAULT_COURSE_PRACTICE_SETTINGS;
  }

  return {
    ...DEFAULT_COURSE_PRACTICE_SETTINGS,
    ...course.practiceSettings,
  };
}

export function isOpenPracticeCourse(
  course: Pick<Course, 'practiceSettings'> | null | undefined,
): boolean {
  return resolveCoursePracticeSettings(course).mode === 'open';
}

export function collectCourseScenarioIds(
  course: Pick<CourseWithLessons, 'lessons'>,
): readonly string[] {
  const ids = new Set<string>();
  for (const lesson of course.lessons) {
    for (const scenarioId of lesson.scenarioIds) {
      ids.add(scenarioId);
    }
  }

  return [...ids];
}

export function scenarioCardIds(scenario: Pick<Scenario, 'cardSource'>): readonly string[] {
  if (scenario.cardSource.mode === 'fixed' || scenario.cardSource.mode === 'snapshot') {
    return scenario.cardSource.cardIds;
  }

  return [];
}

export function resolveScenarioDifficulty(
  scenario: Pick<Scenario, 'cardSource'>,
  indexById: ReadonlyMap<string, Pick<CardIndexEntry, 'difficulty' | 'tags'>>,
): CardDifficulty | null {
  for (const cardId of scenarioCardIds(scenario)) {
    const entry = indexById.get(cardId);
    if (!entry) {
      continue;
    }

    const fromTag = entry.tags.find(
      (tag): tag is CardDifficulty =>
        tag === 'beginner' || tag === 'intermediate' || tag === 'advanced',
    );
    if (fromTag) {
      return fromTag;
    }

    return entry.difficulty;
  }

  return null;
}

export function buildScenarioDifficultyMap(
  scenarios: readonly Scenario[],
  indexEntries: readonly CardIndexEntry[],
): ReadonlyMap<string, CardDifficulty> {
  const indexById = new Map(indexEntries.map((entry) => [entry.id, entry]));
  const map = new Map<string, CardDifficulty>();

  for (const scenario of scenarios) {
    const difficulty = resolveScenarioDifficulty(scenario, indexById);
    if (difficulty) {
      map.set(scenario.id, difficulty);
    }
  }

  return map;
}

export function filterScenarioIdsByDifficulty(
  scenarioIds: readonly string[],
  difficultyMap: ReadonlyMap<string, CardDifficulty>,
  difficulty: CardDifficulty | null,
): readonly string[] {
  if (!difficulty) {
    return scenarioIds;
  }

  return scenarioIds.filter((scenarioId) => difficultyMap.get(scenarioId) === difficulty);
}
