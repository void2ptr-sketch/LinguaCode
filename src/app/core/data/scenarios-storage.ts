import type { Scenario } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';
import type { LegacyScenario } from '../models/scenario.types';

import { normalizeScenario } from './scenario-card-source.utils';

export const SCENARIOS_STORAGE_KEY = 'lingua-code.scenarios';

export const DEFAULT_SCENARIOS: readonly Scenario[] = [
  {
    id: 'demo-scenario',
    title: 'Демо-сценарий',
    description: 'Базовый набор карточек для начала обучения.',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    cardSource: {
      mode: 'fixed',
      cardIds: ['select-1', 'select-2', 'select-3'],
    },
    languagePair: DEFAULT_LANGUAGE_PAIR,
  },
];

export function loadScenariosFromStorage(): readonly Scenario[] {
  const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SCENARIOS;
  }

  try {
    const parsed = JSON.parse(raw) as readonly LegacyScenario[];
    return Array.isArray(parsed) ? parsed.map(normalizeScenario) : DEFAULT_SCENARIOS;
  } catch {
    return DEFAULT_SCENARIOS;
  }
}

export function saveScenariosToStorage(scenarios: readonly Scenario[]): void {
  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
}
