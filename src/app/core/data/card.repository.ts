import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { buildFixtureUrl } from '../api';
import { Card, DrawCard } from '../models';
import { mergeDrawCardQuestionFields } from './draw-card.utils';
import { normalizeLegacyCards } from './card-legacy.mapper';

export const CARDS_STORAGE_KEY = 'lingua-code.cards';

/** Демо-карточки, снятые с seed — не подмешивать из localStorage. */
const REMOVED_SEED_CARD_IDS = new Set(['draw-jiangenshenfang-1']);

type CardsSeedFixture = {
  cards: readonly Card[];
};

@Injectable({ providedIn: 'root' })
export class CardRepository {
  private readonly http = inject(HttpClient);

  loadStored(): readonly Card[] {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as readonly Card[];
      return Array.isArray(parsed) ? normalizeLegacyCards(parsed) : [];
    } catch {
      return [];
    }
  }

  save(cards: readonly Card[]): void {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  }

  loadSeed(): Promise<readonly Card[]> {
    return firstValueFrom(
      this.http.get<CardsSeedFixture>(buildFixtureUrl('/select-cards.json')),
    ).then((fixture) => normalizeLegacyCards(fixture.cards));
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
    const seed = await this.loadSeed();
    const stored = this.loadStored();

    if (stored.length === 0) {
      this.save(seed);
      return seed;
    }

    const merged = this.mergeWithSeed(stored, seed);
    const storedIds = new Set(stored.map((card) => card.id));
    const hasMissingSeedCards = seed.some((card) => !storedIds.has(card.id));

    if (hasMissingSeedCards || merged.length !== stored.length) {
      this.save(merged);
    }

    return merged;
  }

  getById(cards: readonly Card[], cardId: string): Card | null {
    return cards.find((card) => card.id === cardId) ?? null;
  }

  toCatalogItems(cards: readonly Card[]): readonly { id: string; kind: Card['kind']; title: string }[] {
    return cards.map((card) => ({
      id: card.id,
      kind: card.kind,
      title: card.title,
    }));
  }
}
