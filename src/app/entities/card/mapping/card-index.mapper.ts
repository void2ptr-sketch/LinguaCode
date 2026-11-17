import type { Card } from '../model';
import type { CardIndexEntry, CardIndexMetaOverride } from '../model';
import { DEFAULT_LANGUAGE_PAIR } from '../../language-pair/model/language-pair.types';
import { collectCardIpaReadings } from '../utils/card-ipa-index.utils';
import { isContentLanguage } from '../../language-pair/utils/language-pair.utils';
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
  // Prefer explicit metadata (embedded/overlay) and then the card's own tags.
  // Falling back to `[card.kind]` keeps legacy cards without tags usable.
  const baseTags = effectiveMeta?.tags ?? card.tags ?? [card.kind];
  const tags =
    ipaReadings.length > 0 && !baseTags.includes('ipa') ? [...baseTags, 'ipa'] : baseTags;

  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    knownLanguage,
    learningLanguage,
    difficulty: effectiveMeta?.difficulty ?? card.difficulty ?? 'beginner',
    tags,
    ipaReadings,
    updatedAt: effectiveMeta?.updatedAt ?? card.updatedAt ?? '2026-01-01T00:00:00.000Z',
    slug: card.slug,
    languagePairId: effectiveMeta?.languagePairId ?? card.languagePairId,
    courseId: card.courseId,
    programId: card.programId,
    lessonId: card.lessonId,
    scenarioId: card.scenarioId,
    order: card.order,
    published: effectiveMeta?.published ?? card.published,
    requiredTier: effectiveMeta?.requiredTier ?? card.requiredTier,
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
