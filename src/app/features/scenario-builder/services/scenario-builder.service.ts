import { Injectable } from '@angular/core';

import type { Scenario } from '../../../core/models';
import {
  loadScenariosFromStorage,
  saveScenariosToStorage,
} from '../../../core/data/scenarios-storage';

export { SCENARIOS_STORAGE_KEY } from '../../../core/data/scenarios-storage';

/** @deprecated Используйте ScenarioSearchService (HTTP). Оставлен для совместимости тестов. */
@Injectable({ providedIn: 'root' })
export class ScenarioBuilderService {
  loadScenarios(): readonly Scenario[] {
    return loadScenariosFromStorage();
  }

  saveScenarios(scenarios: readonly Scenario[]): void {
    saveScenariosToStorage(scenarios);
  }
}
