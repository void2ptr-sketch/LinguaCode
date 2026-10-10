import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Card, CardSearchCriteria, CardSearchPage } from '../../models';
import type { ApiResponse } from '../../api/api.types';
import { buildApiUrl, buildCardSearchParams } from '../../api';

/**
 * API service for card catalog operations.
 *
 * @remarks
 * Provides search, single-item, and batch retrieval of cards via HTTP.
 */
@Injectable({ providedIn: 'root' })
export class CardsApiService {
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
}
