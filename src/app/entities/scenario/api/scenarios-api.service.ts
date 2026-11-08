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
import type {
  ScenarioCatalogPort,
  ScenarioWritePayload,
} from '../repository/scenario-catalog.port';
import { UserStore } from '../../user/model/user.store';

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
  private readonly userStore = inject(UserStore);

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
    // Backend requires 'query' for /search endpoint.
    // When query is empty, use the list endpoint (/scenarios) instead.
    const hasQuery = !!criteria.query?.trim();
    const url = hasQuery ? buildApiUrl('/scenarios/search') : buildApiUrl('/scenarios');
    const params = buildScenarioSearchParams(criteria);

    return firstValueFrom(this.http.get<ApiResponse<ScenarioSearchPage>>(url, { params })).then(
      (response) => response.data,
    );
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
      this.http.get<ApiResponse<Record<string, unknown>>>(buildApiUrl(`/scenarios/${scenarioId}`)),
    ).then((response) => {
      const raw = response.data;
      // Бэкенд возвращает cardSource как JSON-строку — парсим в объект
      if (typeof raw['cardSource'] === 'string') {
        (raw as Record<string, unknown>)['cardSource'] = JSON.parse(raw['cardSource'] as string);
      }
      return raw as unknown as Scenario;
    });
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
    const body = {
      title: payload.title,
      scenarioDescription: payload.description,
      cardSource: JSON.stringify(payload.cardSource),
    };
    return firstValueFrom(
      this.http.post<ApiResponse<Scenario>>(buildApiUrl('/scenarios'), body),
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
    const body = {
      title: payload.title,
      scenarioDescription: payload.description,
      cardSource: JSON.stringify(payload.cardSource),
      published: payload.published,
    };
    return firstValueFrom(
      this.http.put<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`), body),
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
