import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Card, CardSearchCriteria, CardSearchPage } from '../models';
import type { CardIndexEntry } from '../models/card-index.types';
import { paginateArray } from '../../shared/pagination';

import { buildFixtureUrl } from './api-url';
import {
  buildCardIndex,
  type CardIndexMetaFixture,
} from '../data/card-index.mapper';
import { CardRepository } from '../data/card.repository';
import { buildCardSearchFacets, filterCardIndex } from '../data/card-search.utils';

@Injectable({ providedIn: 'root' })
export class CardsCatalogMockHandler {
  private readonly http = inject(HttpClient);
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
      throw new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Карточка не найдена' },
      });
    }

    return card;
  }

  resetCache(): void {
    this.cards = null;
    this.index = null;
  }

  private async ensureData(): Promise<void> {
    if (this.index && this.cards) {
      return;
    }

    const [cards, metaFixture] = await Promise.all([
      this.cardRepository.ensureLoaded(),
      firstValueFrom(
        this.http.get<CardIndexMetaFixture>(buildFixtureUrl('/card-index-meta.json')),
      ),
    ]);

    this.cards = cards;
    this.index = buildCardIndex(cards, metaFixture.metaById);
  }
}
