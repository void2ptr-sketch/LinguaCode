import type { Card } from '../../../models';
import type { CardIndexEntry } from '../../../models/card-index.types';
import { collectCardIpaReadings } from '../utils/card-ipa-index.utils';
import { isContentLanguage } from '../../language-pair/language-pair.utils';
import { DEFAULT_LANGUAGE_PAIR } from '../../../models/language-pair.types';

/** Переопределение метаданных для отдельной карточки в индексе. */
export type CardIndexMetaOverride = Partial<
  Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage' | 'difficulty' | 'tags' | 'updatedAt'>
>;

/** Фикстура метаданных индекса карточек с маппингом по ID. */
export type CardIndexMetaFixture = {
  metaById: Record<string, CardIndexMetaOverride>;
};

/**
 * Преобразует карточку в запись индекса (`CardIndexEntry`) с учётом метаданных.
 * Приоритет метаданных: `card.meta` → `meta` (из overlay) → значения по умолчанию.
 */
export function cardToIndexEntry(card: Card, meta?: CardIndexMetaOverride): CardIndexEntry {
  // Приоритет метаданных:
  // 1. card.meta (встроенные в карточку)
  // 2. meta (из user-content-overlay)
  // 3. дефолтные значения
  const cardMeta = card.meta;
  const effectiveMeta = cardMeta ?? meta;

  const knownLanguage =
    effectiveMeta?.knownLanguage && isContentLanguage(effectiveMeta.knownLanguage)
      ? effectiveMeta.knownLanguage
      : DEFAULT_LANGUAGE_PAIR.known;
  const learningLanguage =
    effectiveMeta?.learningLanguage && isContentLanguage(effectiveMeta.learningLanguage)
      ? effectiveMeta.learningLanguage
      : DEFAULT_LANGUAGE_PAIR.learning;

  const ipaReadings = collectCardIpaReadings(card);
  const baseTags = effectiveMeta?.tags ?? [card.kind];
  const tags =
    ipaReadings.length > 0 && !baseTags.includes('ipa') ? [...baseTags, 'ipa'] : baseTags;

  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    knownLanguage,
    learningLanguage,
    difficulty: effectiveMeta?.difficulty ?? 'beginner',
    tags,
    ipaReadings,
    updatedAt: effectiveMeta?.updatedAt ?? '2026-01-01T00:00:00.000Z',
    courseId: card.courseId,
    lessonId: card.lessonId,
    scenarioId: card.scenarioId,
  };
}

/**
 * Строит полный индекс карточек из массива с заданными переопределениями метаданных.
 * Каждый карточка преобразуется через `cardToIndexEntry` с метаданными из `metaById`.
 */
export function buildCardIndex(
  cards: readonly Card[],
  metaById: Record<string, CardIndexMetaOverride> = {},
): readonly CardIndexEntry[] {
  return cards.map((card) => cardToIndexEntry(card, metaById[card.id]));
}

/**
 * Объединяет метаданные из фикстуры и хранилища с приоритетом хранилища.
 * Переопределения из `storedMeta` перекрывают значения из `fixtureMeta`.
 */
export function mergeCardIndexMeta(
  fixtureMeta: Record<string, CardIndexMetaOverride>,
  storedMeta: Record<string, CardIndexMetaOverride>,
): Record<string, CardIndexMetaOverride> {
  return { ...fixtureMeta, ...storedMeta };
}
