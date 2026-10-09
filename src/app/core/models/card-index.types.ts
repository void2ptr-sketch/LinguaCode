import type { CardKind } from './card.types';

/**
 * Content language used for cards and UI.
 *
 * @remarks
 * Includes natural languages (en, zh, ru) and programming languages (perl, java, cpp).
 * Do not confuse with UiLocale (see docs/LANGUAGE-PAIR.md).
 */
export type ContentLanguage = 'en' | 'zh' | 'ru' | 'perl' | 'java' | 'cpp';

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
  /** ID курса (Course), к которому привязана карточка. */
  courseId?: string;
  /** ID урока (Lesson), к которому привязана карточка. */
  lessonId?: string;
  /** ID сценария (Scenario), к которому привязана карточка. */
  scenarioId?: string;
};
