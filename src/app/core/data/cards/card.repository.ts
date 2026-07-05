import { Injectable, inject } from '@angular/core';

import { Card } from '../../models';
import { getCardSeedCache } from '../content-seed/content-seed.cache';
import { ContentSeedRepository } from '../content-seed/content-seed.repository';
import { normalizeLegacyCards } from './card-legacy.mapper';
import { mergeDrawCardQuestionFields } from '../chinese/draw-card.utils';
import { migrateUserContentOverlayIfNeeded } from '../user/user-content-overlay.migration';
import { computeCardsOverlay, resolveCards } from '../user/user-content-overlay.resolver';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../user/user-content-overlay.storage';

/** @deprecated Legacy monolithic storage key; migrated into user-content overlay. */
export const CARDS_STORAGE_KEY = 'lingua-code.cards';

/** Демо-карточки, снятые с seed — не подмешивать из overlay. */
const REMOVED_SEED_CARD_IDS = new Set(['draw-jiangenshenfang-1']);

@Injectable({ providedIn: 'root' })
export class CardRepository {
  private readonly contentSeed = inject(ContentSeedRepository);

  loadStored(): readonly Card[] {
    migrateUserContentOverlayIfNeeded();
    return resolveCards(this.getSeed(), readUserContentOverlay());
  }

  save(cards: readonly Card[]): void {
    migrateUserContentOverlayIfNeeded();
    const seed = this.getSeed();
    const previous = readUserContentOverlay();
    const computed = computeCardsOverlay(cards, seed, previous);

    patchUserContentOverlay({
      cards: computed.cards,
      deletedSystemIds: {
        ...previous.deletedSystemIds,
        cards: computed.deletedSystemIds?.cards,
      },
    });
  }

  loadSeed(): Promise<readonly Card[]> {
    return this.contentSeed.preload().then(() => this.getSeed());
  }

  mergeWithSeed(stored: readonly Card[], seed: readonly Card[]): readonly Card[] {
    const byId = new Map<string, Card>();

    for (const card of seed) {
      byId.set(card.id, card);
    }

    for (const card of stored) {
      if (REMOVED_SEED_CARD_IDS.has(card.id)) {
        continue;
      }

      const seedCard = byId.get(card.id);
      if (card.kind === 'draw' && seedCard?.kind === 'draw') {
        byId.set(card.id, mergeDrawCardQuestionFields(card, seedCard));
        continue;
      }

      byId.set(card.id, card);
    }

    return [...byId.values()].filter((card) => !REMOVED_SEED_CARD_IDS.has(card.id));
  }

  async ensureLoaded(): Promise<readonly Card[]> {
    await this.contentSeed.preload();
    migrateUserContentOverlayIfNeeded();
    return this.loadStored();
  }

  getById(cards: readonly Card[], cardId: string): Card | null {
    return cards.find((card) => card.id === cardId) ?? null;
  }

  toCatalogItems(
    cards: readonly Card[],
  ): readonly { id: string; kind: Card['kind']; title: string }[] {
    return cards.map((card) => ({
      id: card.id,
      kind: card.kind,
      title: card.title,
    }));
  }

  private getSeed(): readonly Card[] {
    const seed = getCardSeedCache();
    return seed.length > 0 ? seed : normalizeLegacyCards([]);
  }
}
