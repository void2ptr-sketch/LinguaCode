import { getScenarioSeedCache } from '../../content-seed/content-seed.cache';

/**
 * Returns a display label for a scenario.
 * Prefers the provided title, falls back to the seed cache title, and finally to the scenario ID.
 */
export function scenarioDisplayLabel(scenarioId: string, title?: string | null): string {
  const resolved = title?.trim();
  if (resolved) {
    return resolved;
  }

  const seedTitle = getScenarioSeedCache().find((scenario) => scenario.id === scenarioId)?.title;
  return seedTitle ?? scenarioId;
}
