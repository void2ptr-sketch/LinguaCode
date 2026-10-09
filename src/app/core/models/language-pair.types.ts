import type { ContentLanguage } from './card-index.types';

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

/** Default language pair applied when no user preference exists. */
export const DEFAULT_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'en',
};
