import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Card, CardSearchCriteria, CardSearchPage } from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import { buildCardSearchParams } from './mock/cards-api.params.utils';
import type { CardCatalogPort } from '../repository/card-catalog.port';

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
      this.http.get<ApiResponse<CardSearchPage>>(buildApiUrl('/cards/search'), {
        params: buildCardSearchParams(criteria),
      }),
    ).then((response) => response.data);
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
    return firstValueFrom(this.http.get<ApiResponse<Card>>(buildApiUrl(`/cards/${cardId}`))).then(
      (response) => response.data,
    );
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

    return firstValueFrom(
      this.http.post<ApiResponse<readonly Card[]>>(buildApiUrl('/cards/batch'), {
        ids: cardIds,
      }),
    ).then((response) => response.data);
  }

  /**
   * Creates a new card.
   *
   * @param card - The card to create.
   * @returns Promise resolving to the created card.
   *
   * @example
   * ```ts
   * const created = await cardsApi.create({ ...card, id: crypto.randomUUID() });
   * ```
   */
  create(card: Card): Promise<Card> {
    return firstValueFrom(this.http.post<ApiResponse<Card>>(buildApiUrl('/cards'), card)).then(
      (response) => response.data,
    );
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
    return firstValueFrom(
      this.http.put<ApiResponse<Card>>(buildApiUrl(`/cards/${cardId}`), card),
    ).then((response) => response.data);
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
