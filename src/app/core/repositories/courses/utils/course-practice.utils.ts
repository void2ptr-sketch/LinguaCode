import type { CardDifficulty, CardIndexEntry } from '../../../models/card-index.types';
import {
  DEFAULT_COURSE_PRACTICE_SETTINGS,
  type CoursePracticeSettings,
} from '../../../models/course-practice.types';
import type { Course, CourseWithLessons } from '../../../models/course.types';
import type { Scenario } from '../../../models/scenario.types';

/**
 * Resolves practice settings for a course, falling back to defaults when the course or its settings are missing.
 */
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

/**
 * Returns `true` when the course practice mode is set to `'open'`.
 */
export function isOpenPracticeCourse(
  course: Pick<Course, 'practiceSettings'> | null | undefined,
): boolean {
  return resolveCoursePracticeSettings(course).mode === 'open';
}

/**
 * Collects all unique scenario IDs referenced by every lesson in a course.
 */
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

/**
 * Returns the list of card IDs for a scenario when its `cardSource` mode is `fixed` or `snapshot`.
 *
 * Returns an empty array for `criteria`-mode scenarios which do not reference specific cards.
 */
export function scenarioCardIds(scenario: Pick<Scenario, 'cardSource'>): readonly string[] {
  if (scenario.cardSource.mode === 'fixed' || scenario.cardSource.mode === 'snapshot') {
    return scenario.cardSource.cardIds;
  }

  return [];
}

/**
 * Resolves the difficulty level for a scenario by inspecting its cards.
 *
 * Iterates over the scenario's card IDs and returns the first difficulty found — either from a
 * difficulty tag (e.g. `'beginner'`, `'intermediate'`, `'advanced'`) or from the `difficulty` field
 * of the card index entry. Returns `null` when no cards or difficulties are found.
 */
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

/**
 * Builds a mapping of scenario IDs to their resolved difficulty levels.
 *
 * Iterates over all scenarios and resolves each one's difficulty using the provided card index entries.
 */
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

/**
 * Filters a list of scenario IDs, keeping only those whose resolved difficulty matches the given value.
 *
 * When `difficulty` is `null` the original list is returned unchanged.
 */
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
