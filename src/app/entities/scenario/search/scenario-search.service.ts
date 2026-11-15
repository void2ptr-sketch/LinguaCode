import { Injectable, inject, signal } from '@angular/core';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../model';

import { ScenariosApiService, type ScenarioWritePayload } from '../api/scenarios-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

/**
 * Service for scenario search and management operations.
 *
 * @remarks
 * Wraps `ScenariosApiService` with loading/error state management via Signals.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioSearchService {
  private readonly scenariosApi = inject(ScenariosApiService);
  private readonly logger = inject(AppLoggerService);

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
   * Resolves the next scenario order (`max(scenario_order) + 1`).
   *
   * @returns The next order value (at least `1`).
   */
  getNextOrder(): Promise<number> {
    return this.run(() => this.scenariosApi.getNextOrder());
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
   * Batch-retrieves scenarios by IDs.
   *
   * @param scenarioIds - Array of scenario IDs.
   * @returns Array of scenarios.
   */
  getByIdBatch(scenarioIds: readonly string[]): Promise<readonly Scenario[]> {
    return this.run(() => this.scenariosApi.getByIdBatch(scenarioIds));
  }

  /**
   * Retrieves all scenarios bound to a lesson.
   *
   * @param lessonId - The lesson ID.
   * @returns Scenarios of the lesson ordered by `order`.
   */
  getByLessonId(lessonId: string): Promise<readonly Scenario[]> {
    return this.run(() => this.scenariosApi.getByLessonId(lessonId));
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
   * Adds a card to a scenario's card source.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @param order - Optional 1-based position inside the scenario.
   * @returns The updated scenario.
   */
  addCard(scenarioId: string, cardId: string, order?: number): Promise<Scenario> {
    return this.run(() => this.scenariosApi.addCard(scenarioId, cardId, order));
  }

  /**
   * Removes a card from a scenario's card source.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @returns The updated scenario.
   */
  removeCard(scenarioId: string, cardId: string): Promise<Scenario> {
    return this.run(() => this.scenariosApi.removeCard(scenarioId, cardId));
  }

  /**
   * Moves a card to a new position inside a scenario.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @param order - The new 1-based position.
   * @returns The updated scenario.
   */
  moveCard(scenarioId: string, cardId: string, order: number): Promise<Scenario> {
    return this.run(() => this.scenariosApi.moveCard(scenarioId, cardId, order));
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
    } catch (error) {
      this.logger.error('ScenarioSearch: operation failed', error);
      this.error.set('Не удалось выполнить операцию со сценариями');
      throw new Error('Scenario operation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
