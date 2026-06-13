import type {
  CardSearchCriteria,
  ContentLanguage,
  LanguagePair,
} from '../models';
import type { CardIndexEntry } from '../models/card-index.types';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

const CONTENT_LANGUAGES: readonly ContentLanguage[] = ['en', 'zh', 'ru'];

export const CONTENT_LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  en: 'English',
  zh: '中文',
  ru: 'Русский',
};

export function isContentLanguage(value: unknown): value is ContentLanguage {
  return typeof value === 'string' && CONTENT_LANGUAGES.includes(value as ContentLanguage);
}

export function normalizeLanguagePair(pair?: Partial<LanguagePair> | null): LanguagePair {
  const known = isContentLanguage(pair?.known) ? pair.known : DEFAULT_LANGUAGE_PAIR.known;
  const learning = isContentLanguage(pair?.learning) ? pair.learning : DEFAULT_LANGUAGE_PAIR.learning;

  if (known === learning) {
    return DEFAULT_LANGUAGE_PAIR;
  }

  return { known, learning };
}

export function formatLanguagePair(pair: LanguagePair): string {
  return `${CONTENT_LANGUAGE_LABELS[pair.known]} → ${CONTENT_LANGUAGE_LABELS[pair.learning]}`;
}

export function contentLanguages(): readonly ContentLanguage[] {
  return CONTENT_LANGUAGES;
}

export function cardIndexMatchesPair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  pair: LanguagePair,
): boolean {
  return entry.knownLanguage === pair.known && entry.learningLanguage === pair.learning;
}

export function cardSearchCriteriaMatchesPair(
  criteria: Pick<CardSearchCriteria, 'knownLanguage' | 'learningLanguage'>,
  pair: LanguagePair,
): boolean {
  const knownMatches = !criteria.knownLanguage || criteria.knownLanguage === pair.known;
  const learningMatches =
    !criteria.learningLanguage || criteria.learningLanguage === pair.learning;

  return knownMatches && learningMatches;
}

export function languagePairFromIndexEntry(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
): LanguagePair {
  return {
    known: entry.knownLanguage,
    learning: entry.learningLanguage,
  };
}

export function formatIndexLanguagePair(
  entry: Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage'>,
  labels: Record<ContentLanguage, string> = CONTENT_LANGUAGE_LABELS,
): string {
  return `${labels[entry.knownLanguage]} → ${labels[entry.learningLanguage]}`;
}
