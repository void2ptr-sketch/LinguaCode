import type { Scenario, ScenarioIndexEntry } from '../../models';
import { formatLanguagePair } from '../language-pair/language-pair.utils';
import { scenarioCardsLabel } from './scenario-card-source.utils';

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
