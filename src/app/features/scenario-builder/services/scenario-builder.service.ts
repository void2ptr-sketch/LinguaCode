import { Injectable } from '@angular/core';
import { Scenario } from '../../../core/models';

export const SCENARIOS_STORAGE_KEY = 'lingua-code.scenarios';

const DEFAULT_SCENARIOS: readonly Scenario[] = [
  {
    id: 'demo-scenario',
    title: 'Демо-сценарий',
    description: 'Базовый набор карточек для начала обучения.',
    authorId: 'local-user',
    cardIds: ['select-1', 'select-2', 'select-3'],
  },
];

@Injectable({ providedIn: 'root' })
export class ScenarioBuilderService {
  loadScenarios(): readonly Scenario[] {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SCENARIOS;
    }

    try {
      const parsed = JSON.parse(raw) as readonly Scenario[];
      return Array.isArray(parsed) ? parsed : DEFAULT_SCENARIOS;
    } catch {
      return DEFAULT_SCENARIOS;
    }
  }

  saveScenarios(scenarios: readonly Scenario[]): void {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  }
}
