import type { Card } from '../models';
import type { CardIndexEntry } from '../models/card-index.types';

export type CardIndexMetaOverride = Partial<
  Pick<CardIndexEntry, 'language' | 'difficulty' | 'tags' | 'updatedAt'>
>;

export type CardIndexMetaFixture = {
  metaById: Record<string, CardIndexMetaOverride>;
};

export function cardToIndexEntry(card: Card, meta?: CardIndexMetaOverride): CardIndexEntry {
  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    language: meta?.language ?? 'ru',
    difficulty: meta?.difficulty ?? 'beginner',
    tags: meta?.tags ?? [card.kind],
    updatedAt: meta?.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

export function buildCardIndex(
  cards: readonly Card[],
  metaById: Record<string, CardIndexMetaOverride> = {},
): readonly CardIndexEntry[] {
  return cards.map((card) => cardToIndexEntry(card, metaById[card.id]));
}
