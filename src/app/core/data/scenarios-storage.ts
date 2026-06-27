import type { Scenario } from '../models';
import type { LegacyScenario } from '../models/scenario.types';

import { normalizeScenario } from './scenario-card-source.utils';
import { DEFAULT_SCENARIOS, mergeScenariosWithDefaults } from './scenario-catalog.defaults';

export {
  DEFAULT_SCENARIOS,
  DEFAULT_EN_SCENARIOS,
  DEFAULT_ZH_SCENARIOS,
  RU_ZH_LANGUAGE_PAIR,
} from './scenario-catalog.defaults';

export const SCENARIOS_STORAGE_KEY = 'lingua-code.scenarios';

export function loadScenariosFromStorage(): readonly Scenario[] {
  const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_SCENARIOS];
  }

  try {
    const parsed = JSON.parse(raw) as readonly LegacyScenario[];
    const stored = Array.isArray(parsed) ? parsed.map(normalizeScenario) : [];
    return mergeScenariosWithDefaults(stored);
  } catch {
    return [...DEFAULT_SCENARIOS];
  }
}

export function saveScenariosToStorage(scenarios: readonly Scenario[]): void {
  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
}
