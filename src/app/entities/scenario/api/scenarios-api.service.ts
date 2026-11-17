import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ScenarioCardsService } from '../../../shared/api/generated/scenario-cards';
import type { ScenarioCardAddRequest } from '../../../shared/api/generated/models';

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
import { scenarioToIndexEntry } from '../mapping/scenario-index.mapper';
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
  private readonly scenarioCardsApi = inject(ScenarioCardsService);
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

    // Конвертация числовых ID в строки (бэкенд возвращает Long)
    if (typeof raw['courseId'] === 'number') {
      raw['courseId'] = String(raw['courseId']);
    }
    if (typeof raw['programId'] === 'number') {
      raw['programId'] = String(raw['programId']);
    }
    if (typeof raw['lessonId'] === 'number') {
      raw['lessonId'] = String(raw['lessonId']);
    }

    // Бэкенд возвращает scenario_order — мапим в order
    if (raw['scenario_order'] != null && raw['order'] == null) {
      raw['order'] = raw['scenario_order'];
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
  async search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    // Always use `/scenarios/search`: the plain `/scenarios` list applies
    // tier-based access control and hides drafts, so scenarios created through
    // the GUI (unpublished by default) would never appear in the catalog.
    // The backend requires the `query` parameter to be present (may be empty).
    const params = buildScenarioSearchParams(criteria)
      .set('query', criteria.query ?? '')
      // Spring pagination uses `size`; the mock parser reads `pageSize`.
      .set('size', String(criteria.page.pageSize));

    const response = await firstValueFrom(
      this.http.get<Record<string, unknown>>(buildApiUrl('/scenarios/search'), { params }),
    );

    const { items: rawItems, total } = this.readListPayload(response);
    const items = await Promise.all(rawItems.map((raw) => this.toIndexEntry(raw)));

    const pageSize = criteria.page.pageSize;
    return {
      items,
      page: criteria.page.page,
      pageSize,
      totalItems: total,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  /**
   * Converts a raw backend item to a `ScenarioIndexEntry`.
   *
   * @remarks
   * The real backend returns full `Scenario` DTOs (`cardSource` as a JSON
   * string), while the mock handler returns ready index entries. Both shapes
   * are supported so the catalog list works against either data source.
   */
  private async toIndexEntry(raw: Record<string, unknown>): Promise<ScenarioIndexEntry> {
    if (typeof raw['cardSourceMode'] === 'string') {
      return this.normalizeIndexEntry(raw);
    }

    const scenario = await this.mapScenario({ ...raw });
    return scenarioToIndexEntry(scenario);
  }

  /** Normalises an already index-shaped item (mock backend). */
  private normalizeIndexEntry(raw: Record<string, unknown>): ScenarioIndexEntry {
    const order = raw['order'] ?? raw['scenario_order'];
    return {
      id: String(raw['id'] ?? ''),
      title: String(raw['title'] ?? ''),
      authorId: String(raw['authorId'] ?? ''),
      cardSourceMode: raw['cardSourceMode'] as ScenarioIndexEntry['cardSourceMode'],
      cardSourceSummary: String(raw['cardSourceSummary'] ?? ''),
      published: Boolean(raw['published']),
      updatedAt: String(raw['updatedAt'] ?? ''),
      languagePairSummary:
        typeof raw['languagePairSummary'] === 'string' ? raw['languagePairSummary'] : undefined,
      courseId: raw['courseId'] != null ? String(raw['courseId']) : undefined,
      lessonId: raw['lessonId'] != null ? String(raw['lessonId']) : undefined,
      order: order != null ? Number(order) : undefined,
      requiredTier: raw['requiredTier'] as ScenarioIndexEntry['requiredTier'],
    };
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
   * Retrieves all scenarios bound to a lesson.
   *
   * @remarks
   * Uses the dedicated `GET /scenarios/by-lesson/{lessonId}` endpoint. This is
   * the authoritative source for GUI-created scenarios: they store `lessonId`
   * on the scenario itself, and the backend does not necessarily mirror the
   * binding into `lesson.scenarioIds`.
   *
   * @param lessonId - The lesson ID.
   * @returns Scenarios of the lesson ordered by `order`.
   */
  async getByLessonId(lessonId: string): Promise<readonly Scenario[]> {
    const response = await firstValueFrom(
      this.http.get<Record<string, unknown>>(buildApiUrl(`/scenarios/by-lesson/${lessonId}`)),
    );

    const { items } = this.readListPayload(response);
    const scenarios = await Promise.all(
      items.map((raw) => this.mapScenario({ ...(raw as Record<string, unknown>) })),
    );

    return scenarios.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  }

  /**
   * Resolves the next scenario order (`max(scenario_order) + 1`).
   *
   * @remarks
   * The backend has no dedicated "max order" endpoint, so the catalog is
   * scanned page by page through `/scenarios/search`. Unlike `/scenarios`,
   * the search endpoint returns every scenario (including drafts), which is
   * required to compute the real maximum. Spring pagination parameters
   * (`page` / `size`) are used because `pageSize` is ignored by the backend.
   *
   * @returns The next order value (at least `1`).
   */
  async getNextOrder(): Promise<number> {
    const pageSize = 100;
    let page = 0;
    let total = Number.POSITIVE_INFINITY;
    let fetched = 0;
    let maxOrder = 0;

    while (fetched < total) {
      const response = await firstValueFrom(
        this.http.get<Record<string, unknown>>(buildApiUrl('/scenarios/search'), {
          params: new HttpParams()
            .set('query', '')
            .set('page', String(page))
            // `size` — Spring pagination (real backend); `pageSize` — mock parser.
            .set('size', String(pageSize))
            .set('pageSize', String(pageSize)),
        }),
      );

      const { items, total: pageTotal } = this.readListPayload(response);
      for (const item of items) {
        const value = Number(item['order'] ?? item['scenario_order'] ?? 0);
        if (Number.isFinite(value)) {
          maxOrder = Math.max(maxOrder, value);
        }
      }

      fetched += items.length;
      total = pageTotal;
      if (items.length === 0) {
        break;
      }
      page += 1;
    }

    return maxOrder + 1;
  }

  /**
   * Reads a backend list payload in either supported shape:
   * - real backend: `{ data: [...], total }`;
   * - mock/legacy page: `{ data: { items: [...], totalItems } }`.
   */
  private readListPayload(response: Record<string, unknown>): {
    items: Record<string, unknown>[];
    total: number;
  } {
    const data = response['data'];

    if (Array.isArray(data)) {
      return {
        items: data as Record<string, unknown>[],
        total: Number(response['total'] ?? data.length),
      };
    }

    if (data && typeof data === 'object') {
      const page = data as Record<string, unknown>;
      const items = Array.isArray(page['items'])
        ? (page['items'] as Record<string, unknown>[])
        : [];
      return { items, total: Number(page['totalItems'] ?? items.length) };
    }

    return { items: [], total: 0 };
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
      published: payload.published,
      languagePairId: payload.languagePairId,
      courseId: payload.courseId,
      programId: payload.programId,
      lessonId: payload.lessonId,
      requiredTier: payload.requiredTier,
      order: payload.order,
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
      languagePairId: payload.languagePairId,
      courseId: payload.courseId,
      programId: payload.programId,
      lessonId: payload.lessonId,
      requiredTier: payload.requiredTier,
      order: payload.order,
    };
    return firstValueFrom(
      this.http.put<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`), body),
    ).then((response) => response.data);
  }

  /**
   * Adds a card to a scenario's `cardSource.cardIds`.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @param order - Optional 1-based position inside the scenario.
   * @returns The updated scenario.
   */
  async addCard(scenarioId: string, cardId: string, order?: number): Promise<Scenario> {
    const request: ScenarioCardAddRequest = {
      cardId: Number(cardId),
      ...(order !== undefined ? { order } : {}),
    };
    const response = await firstValueFrom(
      this.scenarioCardsApi.scenariosAddCard(Number(scenarioId), request),
    );
    return this.mapScenario(response.data as unknown as Record<string, unknown>);
  }

  /**
   * Removes a card from a scenario's `cardSource.cardIds`.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @returns The updated scenario.
   */
  async removeCard(scenarioId: string, cardId: string): Promise<Scenario> {
    const response = await firstValueFrom(
      this.scenarioCardsApi.scenariosRemoveCard(Number(scenarioId), Number(cardId)),
    );
    return this.mapScenario(response.data as unknown as Record<string, unknown>);
  }

  /**
   * Moves a card to a new 1-based position inside a scenario.
   *
   * @param scenarioId - The scenario ID.
   * @param cardId - The card ID.
   * @param order - The new 1-based position.
   * @returns The updated scenario.
   */
  async moveCard(scenarioId: string, cardId: string, order: number): Promise<Scenario> {
    const response = await firstValueFrom(
      this.scenarioCardsApi.scenariosMoveCard(Number(scenarioId), Number(cardId), { order }),
    );
    return this.mapScenario(response.data as unknown as Record<string, unknown>);
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
  async findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    const response = await firstValueFrom(
      this.http.get<Record<string, unknown>>(buildApiUrl(`/scenarios/by-card/${cardId}`)),
    );

    const { items } = this.readListPayload(response);
    return Promise.all(items.map((raw) => this.toIndexEntry(raw as Record<string, unknown>)));
  }
}
