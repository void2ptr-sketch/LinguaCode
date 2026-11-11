import type { ContentLanguage } from '../../card/model/card-index.types';

/**
 * A language pair for learning: the user's known language → the target learning language.
 *
 * @remarks
 * Used throughout the app to determine content language direction and display preferences.
 */
export type LanguagePair = {
  known: ContentLanguage;
  learning: ContentLanguage;
};

/**
 * Direction of display/check on a card.
 *
 * @remarks
 * `known-to-learning` — question in the known language, answer in the learning language.
 * `learning-to-known` — question in the learning language, answer in the known language.
 */
export type CardDirection = 'known-to-learning' | 'learning-to-known';

/** A single direction within a grouped mirror-pair card. */
export type DirectionItem = {
  id: string;
  known: string;
  learning: string;
  isActive: boolean;
};

/** A grouped pair of mirror directions (e.g. EN↔RU). */
export type PairGroup = {
  /** Canonical key — sorted language codes joined by a pipe (see `buildMirrorGroupKey`). */
  key: string;
  /** Both directions (0–2). */
  directions: DirectionItem[];
  /** Total configured directions for this pair. */
  count: number;
};

/**
 * Default language pair applied when no user preference exists.
 *
 * @remarks
 * Russian (known) → English (learning). Used as the initial value in `UserStore`.
 */
export const DEFAULT_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'en',
};
