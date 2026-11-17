import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  Card,
  CardDifficulty,
  CardIndexMetaOverride,
  CardKind,
  CardSearchCriteria,
  CardSearchPage,
} from '../model';
import type { ApiResponse, ApiListResponse } from '../../../shared/api/api.types';
import type { BackendCardDto } from '../model/card-backend-dto.types';
import type { CardBatchRetrieveResponse } from '../../../shared/api/generated/models/cardBatchRetrieveResponse';
import { CardBackendAdapter } from '../model/card-backend-adapter';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildCardSearchParams } from './mock/cards-api.params.utils';
import type { CardCatalogPort } from '../repository/card-catalog.port';
import { buildCardIndex } from '../mapping/card-index.mapper';
import { buildCardSearchFacets } from '../search/card-search.utils';
import { CatalogService } from './catalog.service';

/**
 * API service for card catalog operations.
 *
 * @remarks
 * Provides search, single-item, and batch retrieval of cards via HTTP.
 * Implements the `CardCatalogPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class CardsApiService implements CardCatalogPort {
  private readonly http = inject(HttpClient);
  private readonly catalogService = inject(CatalogService);

  private readonly catalogOptions = computed(() => ({
    languageCodes: this.catalogService.contentLanguageCodes(),
    difficulties: this.catalogService.difficulties().map((d) => d.code as CardDifficulty),
    kinds: this.catalogService.cardKinds().map((k) => k.code as CardKind),
  }));

  /**
   * Searches the card catalog with the given criteria.
   *
   * @param criteria - Search criteria including filters, pagination, and language scope.
   * @returns Promise resolving to the paginated search results with facets.
   *
   * @example
   * ```ts
   * const results = await cardsApi.search({
   *   filters: { tags: ['hsk1'] },
   *   page: { page: 0, pageSize: 20 },
   * });
   * ```
   */
  search(criteria: CardSearchCriteria): Promise<CardSearchPage> {
    return firstValueFrom(
      this.http.get<ApiListResponse<BackendCardDto>>(buildApiUrl('/cards/search'), {
        params: buildCardSearchParams(criteria),
      }),
    ).then((response) => {
      const dtos = response.data;
      const totalItems = response.total ?? dtos.length;

      const cards = CardBackendAdapter.toCards(dtos);
      const entries = buildCardIndex(cards, this.buildLanguageMeta(cards, criteria));
      const facets = buildCardSearchFacets(entries, criteria, this.catalogOptions());

      const pageSize = criteria.page.pageSize;
      const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;

      return {
        items: entries,
        page: criteria.page.page,
        pageSize,
        totalItems,
        totalPages,
        facets,
      };
    });
  }

  /**
   * Restores language codes for backend cards.
   *
   * @remarks
   * The backend `Card` DTO exposes only `languagePairId`, while
   * `CardIndexEntry` needs `knownLanguage`/`learningLanguage` for display and
   * facet calculation. When the search is scoped to a language pair, every
   * returned card belongs to that pair, so the requested languages are used as
   * index metadata overrides.
   */
  private buildLanguageMeta(
    cards: readonly Card[],
    criteria: CardSearchCriteria,
  ): Record<string, CardIndexMetaOverride> {
    if (!criteria.knownLanguage || !criteria.learningLanguage) {
      return {};
    }

    const meta: CardIndexMetaOverride = {
      knownLanguage: criteria.knownLanguage,
      learningLanguage: criteria.learningLanguage,
    };

    return Object.fromEntries(cards.map((card) => [card.id, meta]));
  }

  /**
   * Retrieves a single card by ID.
   *
   * @param cardId - The card's unique identifier.
   * @returns Promise resolving to the card.
   *
   * @example
   * ```ts
   * const card = await cardsApi.getById('card-123');
   * ```
   */
  getById(cardId: string): Promise<Card> {
    return firstValueFrom(
      this.http.get<ApiResponse<BackendCardDto>>(buildApiUrl(`/cards/${cardId}`)),
    ).then((response) => CardBackendAdapter.toCard(response.data));
  }

  /**
   * Retrieves multiple cards by their IDs in a single batch request.
   *
   * @param cardIds - Array of card IDs.
   * @returns Promise resolving to the array of cards (empty if `cardIds` is empty).
   *
   * @example
   * ```ts
   * const cards = await cardsApi.getByIds(['card-1', 'card-2']);
   * ```
   */
  getByIds(cardIds: readonly string[]): Promise<readonly Card[]> {
    if (cardIds.length === 0) {
      return Promise.resolve([]);
    }

    return firstValueFrom<CardBatchRetrieveResponse | { data?: CardBatchRetrieveResponse }>(
      this.http.post(buildApiUrl('/cards/batch/retrieve'), {
        ids: cardIds,
      }),
    ).then((response) => {
      // The backend returns `{found, notFound}` at the top level, but some
      // interceptors wrap responses into an `ApiResponse` envelope
      // (`{data: {found, notFound}}`) — support both shapes.
      const withData = response as { data?: CardBatchRetrieveResponse };
      const batch = (withData.data ?? response) as CardBatchRetrieveResponse;
      const found = batch.found ?? [];
      return CardBackendAdapter.toCards(found as BackendCardDto[]);
    });
  }

  /**
   * Creates a new card.
   *
   * @param card - The card to create.
   * @returns Promise resolving to the created card.
   *
   * @example
   * ```ts
   * const created = await cardsApi.create(card);
   * ```
   */
  create(card: Card): Promise<Card> {
    const payload = CardBackendAdapter.toCreatePayload(card);
    return firstValueFrom(
      this.http.post<ApiResponse<BackendCardDto>>(buildApiUrl('/cards'), payload),
    ).then((response) => CardBackendAdapter.toCard(response.data));
  }

  /**
   * Updates an existing card.
   *
   * @param cardId - The card ID.
   * @param card - The updated card.
   * @returns Promise resolving to the updated card.
   *
   * @example
   * ```ts
   * const updated = await cardsApi.update('card-123', { ...card, title: 'New title' });
   * ```
   */
  update(cardId: string, card: Card): Promise<Card> {
    const payload = CardBackendAdapter.toUpdatePayload(cardId, card);
    return firstValueFrom(
      this.http.put<ApiResponse<BackendCardDto>>(buildApiUrl(`/cards/${cardId}`), payload),
    ).then((response) => CardBackendAdapter.toCard(response.data));
  }

  /**
   * Deletes a card by ID.
   *
   * @param cardId - The card ID.
   *
   * @example
   * ```ts
   * await cardsApi.delete('card-123');
   * ```
   */
  delete(cardId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/cards/${cardId}`)),
    ).then(() => undefined);
  }
}
