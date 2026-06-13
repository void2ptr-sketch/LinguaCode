import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import type { Card, CardSearchCriteria, CardSearchPage } from '../models';
import type { CardIndexEntry } from '../models/card-index.types';

import { CardsApiService } from './cards-api.service';
import { CardsCatalogMockHandler } from '../api/cards-catalog.mock.handler';

const INDEX_CACHE_PAGE_SIZE = 1000;

@Injectable({ providedIn: 'root' })
export class CardSearchService {
  private readonly cardsApiService = inject(CardsApiService);
  private readonly catalogMockHandler = inject(CardsCatalogMockHandler);

  private readonly indexCache = signal<readonly CardIndexEntry[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  indexEntries(): readonly CardIndexEntry[] {
    return this.indexCache();
  }

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
