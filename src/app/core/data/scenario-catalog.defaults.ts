import type { LanguagePair } from '../models/language-pair.types';
import type { Scenario } from '../models';

import { getScenarioSeedCache } from './content-seed.cache';
import { isObsoleteRadicalsCatalogItem } from './radicals-course.defaults';
import { migrateUserContentOverlayIfNeeded } from './user-content-overlay.migration';
import { resolveScenarios } from './user-content-overlay.resolver';
import { readUserContentOverlay } from './user-content-overlay.storage';

export const RU_ZH_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'zh',
};

export function getDefaultScenarios(): readonly Scenario[] {
  migrateUserContentOverlayIfNeeded();
  return resolveScenarios(getScenarioSeedCache(), readUserContentOverlay());
}

/** @deprecated Use getDefaultScenarios() after content seed preload. */
export const DEFAULT_SCENARIOS: readonly Scenario[] = [];

export function mergeScenariosWithDefaults(
  stored: readonly Scenario[],
  defaults: readonly Scenario[] = getDefaultScenarios(),
): Scenario[] {
  const byId = new Map<string, Scenario>();

  for (const scenario of defaults) {
    byId.set(scenario.id, scenario);
  }

  for (const scenario of stored) {
    if (isObsoleteRadicalsCatalogItem(scenario.id)) {
      continue;
    }

    const defaultScenario = byId.get(scenario.id);
    byId.set(scenario.id, mergeStoredScenario(scenario, defaultScenario));
  }

  return [...byId.values()];
}

function mergeStoredScenario(stored: Scenario, defaultScenario?: Scenario): Scenario {
  if (!defaultScenario) {
    return stored;
  }

  return {
    ...defaultScenario,
    ...stored,
    languagePair: defaultScenario.languagePair,
    cardSource: defaultScenario.cardSource,
  };
}
