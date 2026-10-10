import type { Scenario } from '../../../models';

import { getScenarioSeedCache } from '../../content-seed/content-seed.cache';
import { migrateUserContentOverlayIfNeeded } from '../../user/overlay/user-content-overlay.migration';
import { computeScenariosOverlay, resolveScenarios } from '../../user/overlay/user-content-overlay.resolver';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../../user/overlay/user-content-overlay.storage';

export {
  RU_ZH_LANGUAGE_PAIR,
  getDefaultScenarios,
  mergeScenariosWithDefaults,
} from '../utils/scenario-catalog.defaults';

/** @deprecated Legacy monolithic storage key; migrated into user-content overlay. */
export const SCENARIOS_STORAGE_KEY = 'lingua-code.scenarios';

/**
 * Reads stored (user-modified) scenarios from the user content overlay.
 * Returns `null` when no user modifications exist; otherwise returns a copy of the stored scenarios.
 */
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
