import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  LegacyScenario,
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
import { normalizeScenario } from '../utils/scenario-card-source.utils';
import type { ContentLanguage } from '../../card/model/card-index.types';
import { LanguagePairsApiService } from '../../language-pair/api';
import { UserStore } from '../../user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

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
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly logger = inject(AppLoggerService);

  /** Cache: languagePairId → { known, learning } resolved from `/language-pairs`. */
  private pairCache: Record<number, { known: ContentLanguage; learning: ContentLanguage }> = {};
  private pairCacheLoaded = false;

  private async ensurePairCache(): Promise<void> {
    if (this.pairCacheLoaded) return;

    try {
      const pairs = await this.languagePairsApi.listAll();
      for (const p of pairs) {
        this.pairCache[p.id] = {
          known: p.knownCode as ContentLanguage,
          learning: p.learningCode as ContentLanguage,
        };
      }
    } catch {
      // /language-pairs may require auth (403) — fallback to default mapping
      // (same fallback as `CoursesApiService` so both entities resolve
      // `languagePairId: 1` consistently).
      this.pairCache[1] = { known: 'ru' as ContentLanguage, learning: 'en' as ContentLanguage };
    }

    this.pairCacheLoaded = true;
  }

  /**
   * Maps a backend scenario DTO to the frontend `Scenario` contract.
   *
   * @remarks
   * The backend stores `cardSource` as a JSON string and references the
   * language pair by numeric `languagePairId` (see the `Scenario` schema in
   * the OpenAPI spec) — it has no `languagePair` object. Without this
   * mapping `scenario.languagePair` would be `undefined` and every
   * `loadScenario()` call would fail with `SCENARIO_LANGUAGE_PAIR_MISMATCH`.
   */
  private async mapScenario(raw: Record<string, unknown>): Promise<Scenario> {
    if (typeof raw['cardSource'] === 'string') {
      try {
        raw['cardSource'] = JSON.parse(raw['cardSource'] as string);
      } catch {
        // Invalid JSON — leave as-is; `normalizeScenario` will treat the
        // source as an empty fixed list, which surfaces `SCENARIO_EMPTY`.
      }
    }

    if (typeof raw['languagePairId'] === 'number') {
      await this.ensurePairCache();
      const codes = this.pairCache[raw['languagePairId'] as number];
      if (codes) {
        raw['languagePair'] = codes;
      }
    }

    if (raw['description'] == null) {
      raw['description'] = raw['scenarioDescription'] ?? '';
    }

    if (typeof raw['id'] === 'number') {
      raw['id'] = String(raw['id']);
    }
    if (typeof raw['authorId'] === 'number') {
      raw['authorId'] = String(raw['authorId']);
    }

    return normalizeScenario(raw as unknown as LegacyScenario);
  }

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
    ).then((response) => this.mapScenario(response.data));
  }

  /**
   * Batch-retrieves scenarios by IDs.
   *
   * @param scenarioIds - Array of scenario IDs.
   * @returns Array of scenarios.
   *
   * @example
   * ```ts
   * const scenarios = await scenariosApi.getByIdBatch(['scenario-1', 'scenario-2']);
   * ```
   */
  async getByIdBatch(scenarioIds: readonly string[]): Promise<readonly Scenario[]> {
    if (scenarioIds.length === 0) return [];

    const { data } = await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(buildApiUrl('/scenarios/batch/retrieve'), {
        ids: scenarioIds,
      }),
    );

    // Backend may return: [{...}, ...] | { data: [{...}, ...] } | { found: [{...}], notFound: [...] }
    let items: unknown[];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record['data'])) {
        items = record['data'] as unknown[];
      } else if (Array.isArray(record['found'])) {
        items = record['found'] as unknown[];
      } else {
        this.logger?.warn('[ScenariosApi] batch/retrieve returned unexpected shape', data);
        items = [];
      }
    } else {
      this.logger?.warn('[ScenariosApi] batch/retrieve returned unexpected shape', data);
      items = [];
    }

    return Promise.all(items.map((raw) => this.mapScenario(raw as Record<string, unknown>)));
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
