import { DEFAULT_SCENARIOS } from './scenario-catalog.defaults';

const SCENARIO_TITLE_BY_ID = new Map(
  DEFAULT_SCENARIOS.map((scenario) => [scenario.id, scenario.title]),
);

export function scenarioDisplayLabel(scenarioId: string, title?: string | null): string {
  const resolved = title?.trim();
  if (resolved) {
    return resolved;
  }

  return SCENARIO_TITLE_BY_ID.get(scenarioId) ?? scenarioId;
}
