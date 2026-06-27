import { getScenarioSeedCache } from './content-seed.cache';

export function scenarioDisplayLabel(scenarioId: string, title?: string | null): string {
  const resolved = title?.trim();
  if (resolved) {
    return resolved;
  }

  const seedTitle = getScenarioSeedCache().find((scenario) => scenario.id === scenarioId)?.title;
  return seedTitle ?? scenarioId;
}
