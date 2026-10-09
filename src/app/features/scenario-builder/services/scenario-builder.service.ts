import { Injectable } from '@angular/core';

import type { Scenario } from '../../../core/models';
import {
  loadScenariosFromStorage,
  saveScenariosToStorage,
} from '../../../core/data/scenarios/scenarios-storage';

export { SCENARIOS_STORAGE_KEY } from '../../../core/data/scenarios/scenarios-storage';

/**
 * @deprecated Use `ScenarioSearchService` (HTTP-based). Kept for test compatibility.
 *
 * @remarks
 * Loads and saves scenarios from/to localStorage. This service is being
 * replaced by the HTTP-based `ScenarioSearchService`.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioBuilderService {
  /**
   * Loads all scenarios from localStorage.
   *
   * @returns Array of scenarios.
   */
  loadScenarios(): readonly Scenario[] {
    return loadScenariosFromStorage();
  }

  /**
   * Saves scenarios to localStorage.
   *
   * @param scenarios - The scenarios to save.
   */
  saveScenarios(scenarios: readonly Scenario[]): void {
    saveScenariosToStorage(scenarios);
  }
}
