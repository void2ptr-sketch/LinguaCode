import type { ContentLanguage, LanguagePair } from '../models';
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
