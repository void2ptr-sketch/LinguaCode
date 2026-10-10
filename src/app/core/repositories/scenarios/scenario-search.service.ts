import { Injectable, inject, signal } from '@angular/core';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../../models';

import { ScenariosApiService, type ScenarioWritePayload } from './scenarios-api.service';

/**
 * Service for scenario search and management operations.
 *
 * @remarks
 * Wraps `ScenariosApiService` with loading/error state management via Signals.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioSearchService {
  private readonly scenariosApi = inject(ScenariosApiService);

  /** Whether a scenario operation is in progress. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

  /**
   * Searches scenarios by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of scenario index entries.
   *
   * @example
   * ```ts
   * const results = await scenarioSearchService.search({
   *   filters: { tags: ['grammar'] },
   * });
   * ```
   */
  search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    return this.run(() => this.scenariosApi.search(criteria));
  }

  /**
   * Retrieves a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   * @returns The scenario.
   */
  getById(scenarioId: string): Promise<Scenario> {
    return this.run(() => this.scenariosApi.getById(scenarioId));
  }

  /**
   * Creates a new scenario.
   *
   * @param payload - The scenario write payload.
   * @returns The created scenario.
   */
  create(payload: ScenarioWritePayload): Promise<Scenario> {
    return this.run(() => this.scenariosApi.create(payload));
  }

  /**
   * Updates an existing scenario.
   *
   * @param scenarioId - The scenario ID.
   * @param payload - The scenario write payload.
   * @returns The updated scenario.
   */
  update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario> {
    return this.run(() => this.scenariosApi.update(scenarioId, payload));
  }

  /**
   * Deletes a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   */
  delete(scenarioId: string): Promise<void> {
    return this.run(() => this.scenariosApi.delete(scenarioId));
  }

  /**
   * Finds all scenarios that reference a given card.
   *
   * @param cardId - The card ID.
   * @returns Array of scenario index entries that use this card.
   */
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
