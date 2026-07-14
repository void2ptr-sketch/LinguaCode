import { Injectable, inject } from '@angular/core';

import type { Card, CardSearchCriteria, CardSearchPage } from '../../models';
import type { CardIndexEntry } from '../../models/card-index.types';
import { paginateArray } from '../../../shared/pagination';

import { buildCardIndex } from '../../data/cards/card-index.mapper';
import { loadCardIndexMetaOverrides } from '../../data/cards/card-index-meta.storage';
import { CardRepository } from '../../data/cards/card.repository';
import { buildCardSearchFacets, filterCardIndex } from '../../data/cards/card-search.utils';

@Injectable({ providedIn: 'root' })
export class CardsCatalogMockHandler {
  private readonly cardRepository = inject(CardRepository);

  private cards: readonly Card[] | null = null;
  private index: readonly CardIndexEntry[] | null = null;

  async search(criteria: CardSearchCriteria): Promise<CardSearchPage> {
    await this.ensureData();

    const filtered = filterCardIndex(this.index!, criteria);
    const facets = buildCardSearchFacets(this.index!, criteria);
    const page = paginateArray(filtered, criteria.page);

    return {
      ...page,
      facets,
    };
  }

  async getById(cardId: string): Promise<Card> {
    await this.ensureData();

    const card = this.cards!.find((item) => item.id === cardId);
    if (!card) {
      throw new Error('Карточка не найдена');
    }

    return card;
  }

  resetCache(): void {
    this.cards = null;
    this.index = null;
  }

  async ensureIndexForCardLookup(): Promise<void> {
    await this.ensureData();
  }

  async getIndexEntry(cardId: string): Promise<CardIndexEntry | null> {
    await this.ensureData();
    return this.index!.find((item) => item.id === cardId) ?? null;
  }

  async getByIds(cardIds: readonly string[]): Promise<readonly Card[]> {
    await this.ensureData();

    const cards: Card[] = [];
    for (const cardId of cardIds) {
      const card = this.cards!.find((item) => item.id === cardId);
      if (card) {
        cards.push(card);
      }
    }

    return cards;
  }

  private async ensureData(): Promise<void> {
    if (this.index && this.cards) {
      return;
    }

    const cards = await this.cardRepository.ensureLoaded();
    const metaById = loadCardIndexMetaOverrides();
    this.cards = cards;
    this.index = buildCardIndex(cards, metaById);
  }
}
