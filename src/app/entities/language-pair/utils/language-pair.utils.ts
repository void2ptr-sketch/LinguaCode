import type { CardSearchCriteria, ContentLanguage } from '../../card/model';
import type { LanguageDto } from '../api/language-dto.types';
import type { LanguagePair } from '../model/language-pair.types';
import type { CardIndexEntry } from '../../card/model';
import { DEFAULT_LANGUAGE_PAIR } from '../model/language-pair.types';

/**
 * Type guard: checks if `value` is a valid content language code.
 *
 * @remarks
 * Accepts any non-empty string.  Actual filtering by available
 * languages is delegated to `LanguageService.getCodes()` — callers
 * that need strict validation should pass `languages` explicitly.
 */
export function isContentLanguage(value: unknown): value is ContentLanguage {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Normalises a partial or invalid language pair, falling back to defaults.
 *
 * If both `known` and `learning` resolve to the same language, returns the default language pair.
 */
export function normalizeLanguagePair(pair?: Partial<LanguagePair> | null): LanguagePair {
  const known = isContentLanguage(pair?.known) ? pair.known : DEFAULT_LANGUAGE_PAIR.known;
  const learning = isContentLanguage(pair?.learning)
    ? pair.learning
    : DEFAULT_LANGUAGE_PAIR.learning;

  if (known === learning) {
    return DEFAULT_LANGUAGE_PAIR;
  }

  return { known, learning };
}

/** Checks whether two language pairs are identical. */
export function languagePairsEqual(left: LanguagePair, right: LanguagePair): boolean {
  return left.known === right.known && left.learning === right.learning;
}

/**
 * Builds the canonical mirror-group key for a language pair.
 *
 * @remarks
 * A mirror pair (e.g. ru→en + en→ru) consists of two backend rows; both
 * directions share the same group key built from their sorted language
 * codes (e.g. `'en|ru'`). Used to group pairs in the UI and to scope
 * per-group activation state so that events within one mirror pair never
 * leak into other mirror pairs.
 */
export function buildMirrorGroupKey(known: string, learning: string): string {
  return [known, learning].sort().join('|');
}

/**
 * Formats a language pair as a human-readable string.
 *
 * Uses `labels` if provided, otherwise falls back to the language codes.
 */
export function formatLanguagePair(
  pair: LanguagePair,
  labels: Record<string, string> = {},
): string {
  const knownLabel = labels[pair.known] ?? pair.known;
  const learningLabel = labels[pair.learning] ?? pair.learning;
  return `${knownLabel} → ${learningLabel}`;
}

/**
 * Extracts a language pair from a card index entry.
 */
export function languagePairFromIndexEntry(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
): LanguagePair {
  return {
    known: entry.knownLanguage,
    learning: entry.learningLanguage,
  };
}

/**
 * Formats a language pair from a card index entry.
 */
export function formatIndexLanguagePair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  labels: Record<string, string> = {},
): string {
  const knownLabel = labels[entry.knownLanguage] ?? entry.knownLanguage;
  const learningLabel = labels[entry.learningLanguage] ?? entry.learningLanguage;
  return `${knownLabel} → ${learningLabel}`;
}

/** Checks whether a card index entry matches the given language pair. */
export function cardIndexMatchesPair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  pair: LanguagePair,
): boolean {
  return entry.knownLanguage === pair.known && entry.learningLanguage === pair.learning;
}

/**
 * Checks whether card search criteria match the given language pair.
 *
 * Omitted criteria fields are treated as wildcards.
 */
export function cardSearchCriteriaMatchesPair(
  criteria: Pick<CardSearchCriteria, 'knownLanguage' | 'learningLanguage'>,
  pair: LanguagePair,
): boolean {
  const knownMatches = !criteria.knownLanguage || criteria.knownLanguage === pair.known;
  const learningMatches = !criteria.learningLanguage || criteria.learningLanguage === pair.learning;
  return knownMatches && learningMatches;
}

/**
 * Builds a `{ code → displayName }` map from backend `LanguageDto[]`.
 */
export function buildLanguageLabels(languages: LanguageDto[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const lang of languages) {
    labels[lang.code] = lang.displayName;
  }
  return labels;
}
