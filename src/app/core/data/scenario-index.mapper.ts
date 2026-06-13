import type { Scenario, ScenarioIndexEntry } from '../models';
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
  };
}

export function sortScenariosByUpdatedAt(
  entries: readonly ScenarioIndexEntry[],
): readonly ScenarioIndexEntry[] {
  return [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
