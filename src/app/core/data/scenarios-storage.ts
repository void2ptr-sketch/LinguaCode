import type { Scenario } from '../models';

import { getScenarioSeedCache } from './content-seed.cache';
import { migrateUserContentOverlayIfNeeded } from './user-content-overlay.migration';
import { computeScenariosOverlay, resolveScenarios } from './user-content-overlay.resolver';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from './user-content-overlay.storage';

export {
  RU_ZH_LANGUAGE_PAIR,
  getDefaultScenarios,
  mergeScenariosWithDefaults,
} from './scenario-catalog.defaults';

/** @deprecated Legacy monolithic storage key; migrated into user-content overlay. */
export const SCENARIOS_STORAGE_KEY = 'lingua-code.scenarios';

export function readStoredScenarios(): readonly Scenario[] | null {
  const overlay = readUserContentOverlay();
  const hasStored =
    Object.keys(overlay.scenarios).length > 0 ||
    Boolean(overlay.deletedSystemIds?.scenarios?.length);

  if (!hasStored) {
    return null;
  }

  migrateUserContentOverlayIfNeeded();
  return [...loadScenariosFromStorage()];
}

export function loadScenariosFromStorage(): readonly Scenario[] {
  migrateUserContentOverlayIfNeeded();
  return resolveScenarios(getScenarioSeedCache(), readUserContentOverlay());
}

export function saveScenariosToStorage(scenarios: readonly Scenario[]): void {
  migrateUserContentOverlayIfNeeded();
  const seed = getScenarioSeedCache();
  const previous = readUserContentOverlay();
  const computed = computeScenariosOverlay(scenarios, seed, previous);

  patchUserContentOverlay({
    scenarios: computed.scenarios,
    deletedSystemIds: {
      ...previous.deletedSystemIds,
      scenarios: computed.deletedSystemIds?.scenarios,
    },
  });
}
