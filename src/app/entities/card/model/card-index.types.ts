import type { CardKind } from './card.types';

/**
 * Content language used for cards and UI.
 *
 * @remarks
 * Includes natural languages, programming languages, and a few common
 * aliases (e.g. `c++` → cpp, `javascript` → js).
 * Do not confuse with UiLocale (see docs/FEATURES/LANGUAGE-PAIR.md).
 */
export type ContentLanguage =
  | 'en' | 'zh' | 'ru' | 'ja' | 'de' | 'fr' | 'es' | 'ko' | 'ar' | 'pt' | 'it'
  | 'nl' | 'pl' | 'tr' | 'cs' | 'sv' | 'da' | 'fi' | 'no' | 'hu' | 'he' | 'th'
  | 'vi' | 'uk' | 'lt' | 'lv' | 'ee' | 'ro' | 'bg' | 'hr' | 'sk' | 'sl' | 'ca'
  | 'gl' | 'eu' | 'id' | 'ms' | 'tl'
  | 'cpp' | 'java' | 'perl' | 'hs' | 'rs' | 'js';

/**
 * Difficulty level of a card.
 *
 * @remarks
 * Used for filtering and sorting in the card catalog and practice sessions.
 */
export type CardDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Lightweight catalog entry — without card payload.
 *
 * @remarks
 * Used in lists, filters, and server-side search.
 */
export type CardIndexEntry = {
  id: string;
  kind: CardKind;
  title: string;
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  difficulty: CardDifficulty;
  tags: readonly string[];
  /** Normalized IPA transcriptions for catalog search. */
  ipaReadings: readonly string[];
  updatedAt: string;
  /** ID of the Course this card belongs to. */
  courseId?: string;
  /** ID of the Lesson this card belongs to. */
  lessonId?: string;
  /** ID of the Scenario this card belongs to. */
  scenarioId?: string;
};

/**
 * Partial override of card index metadata for a single card.
 *
 * @remarks
 * Used to override index metadata (e.g., from user-content-overlay or fixture data)
 * on top of values derived from the card itself.
 */
export type CardIndexMetaOverride = Partial<
  Pick<CardIndexEntry, 'knownLanguage' | 'learningLanguage' | 'difficulty' | 'tags' | 'updatedAt'>
>;

/**
 * Card index metadata fixture with mapping by card ID.
 *
 * @remarks
 * Provides metadata overrides for multiple cards at once, keyed by card ID.
 */
export type CardIndexMetaFixture = {
  metaById: Record<string, CardIndexMetaOverride>;
};
