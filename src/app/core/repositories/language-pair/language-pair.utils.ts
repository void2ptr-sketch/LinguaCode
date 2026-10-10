import type { CardSearchCriteria, ContentLanguage, LanguagePair } from '../../models';
import type { CardIndexEntry } from '../../models/card-index.types';
import { DEFAULT_LANGUAGE_PAIR } from '../../models/language-pair.types';

const CONTENT_LANGUAGES: readonly ContentLanguage[] = ['en', 'zh', 'ru', 'perl', 'java', 'cpp'];

/**
 * Display labels for each supported content language.
 *
 * Maps content language codes to their human-readable names.
 */
export const CONTENT_LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  en: 'English',
  zh: '中文',
  ru: 'Русский',
  perl: 'Perl',
  java: 'Java',
  cpp: 'C++',
};

/**
 * Type guard that checks whether the given value is a valid content language.
 *
 * @param value — Value to validate.
 * @returns `true` if `value` is a recognised `ContentLanguage`.
 */
export function isContentLanguage(value: unknown): value is ContentLanguage {
  return typeof value === 'string' && CONTENT_LANGUAGES.includes(value as ContentLanguage);
}

/**
 * Normalises a partial or invalid language pair, falling back to defaults for missing or incorrect values.
 *
 * If both `known` and `learning` resolve to the same language, returns the default language pair.
 *
 * @param pair — Partial or full language pair, possibly `null` or `undefined`.
 * @returns A valid `LanguagePair` with both `known` and `learning` set.
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

/**
 * Checks whether two language pairs are identical.
 *
 * @param left — First language pair.
 * @param right — Second language pair.
 * @returns `true` if both `known` and `learning` languages match.
 */
export function languagePairsEqual(left: LanguagePair, right: LanguagePair): boolean {
  return left.known === right.known && left.learning === right.learning;
}

/**
 * Formats a language pair as a human-readable string with an arrow separator.
 *
 * Example: 'English -> Chinese'
 *
 * @param pair — Language pair to format.
 * @returns Formatted string representation.
 */
export function formatLanguagePair(pair: LanguagePair): string {
  return `${CONTENT_LANGUAGE_LABELS[pair.known]} → ${CONTENT_LANGUAGE_LABELS[pair.learning]}`;
}

/**
 * Returns the list of all supported content languages.
 *
 * @returns Read-only array of content language codes.
 */
export function contentLanguages(): readonly ContentLanguage[] {
  return CONTENT_LANGUAGES;
}

/**
 * Checks whether a card index entry matches the given language pair.
 *
 * @param entry — Card index entry to check.
 * @param pair — Language pair to compare against.
 * @returns `true` if both `knownLanguage` and `learningLanguage` match.
 */
export function cardIndexMatchesPair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  pair: LanguagePair,
): boolean {
  return entry.knownLanguage === pair.known && entry.learningLanguage === pair.learning;
}

/**
 * Checks whether card search criteria match the given language pair.
 *
 * Omitted criteria fields are treated as wildcards — only non-empty fields are compared.
 *
 * @param criteria — Search criteria to check.
 * @param pair — Language pair to compare against.
 * @returns `true` if all specified criteria fields match the pair.
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
 * Extracts a language pair from a card index entry.
 *
 * @param entry — Card index entry containing language information.
 * @returns A `LanguagePair` constructed from the entry's language fields.
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
 * Formats a language pair from a card index entry as a human-readable string.
 *
 * Uses the provided `labels` map or falls back to the default `CONTENT_LANGUAGE_LABELS`.
 *
 * @param entry — Card index entry containing language information.
 * @param labels — Optional custom labels map for language names.
 * @returns Formatted string representation of the language pair.
 */
export function formatIndexLanguagePair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  labels: Record<ContentLanguage, string> = CONTENT_LANGUAGE_LABELS,
): string {
  return `${labels[entry.knownLanguage]} → ${labels[entry.learningLanguage]}`;
}
