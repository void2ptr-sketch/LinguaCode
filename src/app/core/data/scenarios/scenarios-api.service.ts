import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  LanguagePair,
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../../models';
import type { ApiResponse } from '../../api/api.types';
import { buildApiUrl } from '../../api/api-url';
import { buildScenarioSearchParams } from '../../api/scenarios/scenarios-api.params.utils';

/**
 * Payload for creating or updating a scenario via the scenarios API.
 *
 * @remarks
 * Used in `ScenariosApiService` methods to send scenario data to the backend.
 */
export type ScenarioWritePayload = {
  title: string;
  description: string;
  cardSource: Scenario['cardSource'];
  published: boolean;
  languagePair?: LanguagePair;
};

/**
 * HTTP API service for scenario operations.
 *
 * @remarks
 * Wraps the backend scenarios API with Promise-based methods.
 */
@Injectable({ providedIn: 'root' })
export class ScenariosApiService {
  private readonly http = inject(HttpClient);

  /**
   * Searches scenarios by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of scenario index entries.
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
   */
  findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly ScenarioIndexEntry[]>>(
        buildApiUrl(`/scenarios/by-card/${cardId}`),
      ),
    ).then((response) => response.data);
  }
}
