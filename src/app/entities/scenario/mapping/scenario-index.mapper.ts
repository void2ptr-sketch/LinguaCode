import type { Scenario, ScenarioIndexEntry } from '../model';
import { formatLanguagePair } from '../../language-pair/utils/language-pair.utils';
import { scenarioCardsLabel } from '../utils/scenario-card-source.utils';

export function scenarioToIndexEntry(scenario: Scenario): ScenarioIndexEntry {
  return {
    id: scenario.id,
    title: scenario.title,
    authorId: scenario.authorId,
    cardSourceMode: scenario.cardSource.mode,
    cardSourceSummary: scenarioCardsLabel(scenario.cardSource),
    published: scenario.published,
    updatedAt: scenario.updatedAt,
    languagePairSummary: scenario.languagePair
      ? formatLanguagePair(scenario.languagePair)
      : undefined,
    courseId: scenario.courseId,
    lessonId: scenario.lessonId,
    order: scenario.order,
  };
}

/**
 * Returns a new array of scenario index entries sorted by update date in descending order.
 * The most recently updated entries appear first.
 */
export function sortScenariosByUpdatedAt(
  entries: readonly ScenarioIndexEntry[],
): readonly ScenarioIndexEntry[] {
  return [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
