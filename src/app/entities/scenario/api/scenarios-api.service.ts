import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildScenarioSearchParams } from './mock/scenarios-api.params.utils';
import type { ScenarioCatalogPort, ScenarioWritePayload } from '../repository/scenario-catalog.port';

export type { ScenarioWritePayload } from '../repository/scenario-catalog.port';

/**
 * HTTP API service for scenario operations.
 *
 * @remarks
 * Wraps the backend scenarios API with Promise-based methods. Implements the
 * `ScenarioCatalogPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class ScenariosApiService implements ScenarioCatalogPort {
  private readonly http = inject(HttpClient);

  /**
   * Searches scenarios by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of scenario index entries.
   *
   * @example
   * ```ts
   * const results = await scenariosApi.search({
   *   filters: { tags: ['hsk1'] },
   *   page: { page: 0, pageSize: 20 },
   * });
   * ```
   */
  search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<ScenarioSearchPage>>(buildApiUrl('/scenarios/search'), {
        params: buildScenarioSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  /**
   * Retrieves a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   * @returns The scenario.
   *
   * @example
   * ```ts
   * const scenario = await scenariosApi.getById('scenario-123');
   * ```
   */
  getById(scenarioId: string): Promise<Scenario> {
    return firstValueFrom(
      this.http.get<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`)),
    ).then((response) => response.data);
  }

  /**
   * Creates a new scenario.
   *
   * @param payload - The scenario write payload.
   * @returns The created scenario.
   *
   * @example
   * ```ts
   * const scenario = await scenariosApi.create({
   *   title: 'Daily Greetings',
   *   description: 'Common phrases for everyday use',
   *   published: false,
   *   cardSource: { type: 'manual', cardIds: ['card-1', 'card-2'] },
   * });
   * ```
   */
  create(payload: ScenarioWritePayload): Promise<Scenario> {
    return firstValueFrom(
      this.http.post<ApiResponse<Scenario>>(buildApiUrl('/scenarios'), payload),
    ).then((response) => response.data);
  }

  /**
   * Updates an existing scenario.
   *
   * @param scenarioId - The scenario ID.
   * @param payload - The scenario write payload.
   * @returns The updated scenario.
   *
   * @example
   * ```ts
   * const updated = await scenariosApi.update('scenario-123', {
   *   title: 'Updated Title',
   *   description: 'New description',
   *   published: true,
   *   cardSource: { type: 'manual', cardIds: ['card-1'] },
   * });
   * ```
   */
  update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario> {
    return firstValueFrom(
      this.http.put<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`), payload),
    ).then((response) => response.data);
  }

  /**
   * Deletes a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   *
   * @example
   * ```ts
   * await scenariosApi.delete('scenario-123');
   * ```
   */
  delete(scenarioId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/scenarios/${scenarioId}`)),
    ).then(() => undefined);
  }

  /**
   * Finds all scenarios that reference a given card.
   *
   * @param cardId - The card ID.
   * @returns Array of scenario index entries that use this card.
   *
   * @example
   * ```ts
   * const scenarios = await scenariosApi.findUsingCard('card-456');
   * ```
   */
  findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly ScenarioIndexEntry[]>>(
        buildApiUrl(`/scenarios/by-card/${cardId}`),
      ),
    ).then((response) => response.data);
  }
}
