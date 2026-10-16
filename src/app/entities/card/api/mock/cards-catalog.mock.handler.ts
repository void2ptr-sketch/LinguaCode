import { Injectable, inject } from '@angular/core';

import type { Card, CardSearchCriteria, CardSearchPage } from '../../model';
import type { CardIndexEntry } from '../../model';
import { paginateArray } from '../../../../shared/utils/pagination';

import { buildCardIndex } from '../../mapping/card-index.mapper';
import { loadCardIndexMetaOverrides } from '../../storage/card-index-meta.storage';
import { CardRepository } from '../../repository/card.repository';
import { buildCardSearchFacets, filterCardIndex } from '../../search/card-search.utils';

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

  /**
   * Retrieves the index entry for a card by its ID.
   *
   * @param cardId - The unique identifier of the card.
   * @returns The `CardIndexEntry` for the card, or `null` if not found.
   */
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

  /**
   * Creates a new card and persists it via the card repository (overlay + seed).
   *
   * @param card - The card to create.
   * @returns The created card.
   */
  async create(card: Card): Promise<Card> {
    await this.ensureData();
    this.cardRepository.save([...this.cards!, card]);
    this.resetCache();
    return card;
  }

  /**
   * Updates an existing card and persists it via the card repository.
   *
   * @param cardId - The card ID.
   * @param card - The updated card.
   * @returns The updated card.
   * @throws `Error` when the card does not exist.
   */
  async update(cardId: string, card: Card): Promise<Card> {
    await this.ensureData();
    if (!this.cards!.some((item) => item.id === cardId)) {
      throw new Error('Карточка не найдена');
    }
    this.cardRepository.save(this.cards!.map((item) => (item.id === cardId ? card : item)));
    this.resetCache();
    return card;
  }

  /**
   * Deletes a card by ID and persists the change via the card repository.
   *
   * @param cardId - The card ID.
   */
  async delete(cardId: string): Promise<void> {
    await this.ensureData();
    this.cardRepository.save(this.cards!.filter((item) => item.id !== cardId));
    this.resetCache();
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
