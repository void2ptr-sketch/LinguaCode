import { Injectable, inject, signal } from '@angular/core';

import type { Card, CardSearchCriteria, CardSearchPage } from '../../models';
import type { CardIndexEntry } from '../../models/card-index.types';

import { CardsApiService } from './cards-api.service';
import { CardsCatalogMockHandler } from '../../api/cards/cards-catalog.mock.handler';

const INDEX_CACHE_PAGE_SIZE = 1000;

/**
 * Service for searching and managing card index entries.
 *
 * @remarks
 * Maintains a local cache of card index entries loaded from the API.
 * Provides search, lookup, and catalog refresh functionality.
 */
@Injectable({ providedIn: 'root' })
export class CardSearchService {
  private readonly cardsApiService = inject(CardsApiService);
  private readonly catalogMockHandler = inject(CardsCatalogMockHandler);

  private readonly indexCache = signal<readonly CardIndexEntry[]>([]);

  /** Whether the index or a search operation is in progress. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

  /**
   * Returns the current index cache entries.
   *
   * @returns Array of card index entries.
   */
  indexEntries(): readonly CardIndexEntry[] {
    return this.indexCache();
  }

  /**
   * Loads the full card index from the API if not already cached.
   *
   * @remarks
   * Idempotent — skips loading if the cache already contains entries.
   *
   * @example
   * ```ts
   * await cardSearchService.ensureIndexLoaded();
   * const entries = cardSearchService.indexEntries();
   * ```
   */
  async ensureIndexLoaded(): Promise<void> {
    if (this.indexCache().length > 0) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await this.cardsApiService.search({
        page: { page: 0, pageSize: INDEX_CACHE_PAGE_SIZE },
      });
      this.indexCache.set(page.items);
    } catch {
      this.error.set('Не удалось загрузить каталог карточек');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Searches cards by criteria and merges results into the index cache.
   *
   * @param criteria - The search criteria.
   * @returns A page of card search results.
   */
  async search(criteria: CardSearchCriteria): Promise<CardSearchPage> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await this.cardsApiService.search(criteria);
      this.mergeIndexCache(page.items);
      return page;
    } catch {
      this.error.set('Не удалось выполнить поиск карточек');
      throw new Error('Card search failed');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Retrieves a single card by its ID.
   *
   * @param cardId - The card ID.
   * @returns The card.
   */
  async getCardById(cardId: string): Promise<Card> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await this.cardsApiService.getById(cardId);
    } catch {
      this.error.set('Карточка не найдена');
      throw new Error('Card not found');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clears the index cache and mock handler cache.
   *
   * @remarks
   * Call after creating, updating, or deleting cards to force a reload.
   */
  refreshCatalog(): void {
    this.indexCache.set([]);
    this.catalogMockHandler.resetCache();
  }

  private mergeIndexCache(entries: readonly CardIndexEntry[]): void {
    if (entries.length === 0) {
      return;
    }

    const merged = new Map(this.indexCache().map((entry) => [entry.id, entry]));
    for (const entry of entries) {
      merged.set(entry.id, entry);
    }

    this.indexCache.set([...merged.values()]);
  }
}
