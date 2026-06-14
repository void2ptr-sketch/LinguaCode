import type { Card } from '../models';
import type { CardIndexEntry } from '../models/card-index.types';
import { collectCardIpaReadings } from './card-ipa-index.utils';
import { isContentLanguage } from './language-pair.utils';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

export type CardIndexMetaOverride = Partial<
  Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage' | 'difficulty' | 'tags' | 'updatedAt'>
>;

export type CardIndexMetaFixture = {
  metaById: Record<string, CardIndexMetaOverride>;
};

export function cardToIndexEntry(card: Card, meta?: CardIndexMetaOverride): CardIndexEntry {
  const knownLanguage =
    meta?.knownLanguage && isContentLanguage(meta.knownLanguage)
      ? meta.knownLanguage
      : DEFAULT_LANGUAGE_PAIR.known;
  const learningLanguage =
    meta?.learningLanguage && isContentLanguage(meta.learningLanguage)
      ? meta.learningLanguage
      : DEFAULT_LANGUAGE_PAIR.learning;

  const ipaReadings = collectCardIpaReadings(card);
  const baseTags = meta?.tags ?? [card.kind];
  const tags = ipaReadings.length > 0 && !baseTags.includes('ipa') ? [...baseTags, 'ipa'] : baseTags;

  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    knownLanguage,
    learningLanguage,
    difficulty: meta?.difficulty ?? 'beginner',
    tags,
    ipaReadings,
    updatedAt: meta?.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

export function buildCardIndex(
  cards: readonly Card[],
  metaById: Record<string, CardIndexMetaOverride> = {},
): readonly CardIndexEntry[] {
  return cards.map((card) => cardToIndexEntry(card, metaById[card.id]));
}

export function mergeCardIndexMeta(
  fixtureMeta: Record<string, CardIndexMetaOverride>,
  storedMeta: Record<string, CardIndexMetaOverride>,
): Record<string, CardIndexMetaOverride> {
  return { ...fixtureMeta, ...storedMeta };
}
