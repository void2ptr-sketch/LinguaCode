import { Injectable, inject, signal } from '@angular/core';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../models';

import { ScenariosApiService, type ScenarioWritePayload } from './scenarios-api.service';

@Injectable({ providedIn: 'root' })
export class ScenarioSearchService {
  private readonly scenariosApi = inject(ScenariosApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    return this.run(() => this.scenariosApi.search(criteria));
  }

  getById(scenarioId: string): Promise<Scenario> {
    return this.run(() => this.scenariosApi.getById(scenarioId));
  }

  create(payload: ScenarioWritePayload): Promise<Scenario> {
    return this.run(() => this.scenariosApi.create(payload));
  }

  update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario> {
    return this.run(() => this.scenariosApi.update(scenarioId, payload));
  }

  delete(scenarioId: string): Promise<void> {
    return this.run(() => this.scenariosApi.delete(scenarioId));
  }

  findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    return this.run(() => this.scenariosApi.findUsingCard(cardId));
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await action();
    } catch {
      this.error.set('Не удалось выполнить операцию со сценариями');
      throw new Error('Scenario operation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
