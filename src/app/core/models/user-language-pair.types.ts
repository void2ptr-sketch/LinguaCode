import type { LanguagePair } from './language-pair.types';
import type { CjkLearningPreferences, PhoneticPreferences } from './phonetic-content.types';
import type { LearningSessionPreferences } from './learning-session.types';

/**
 * Settings specific to a single language pair.
 *
 * @remarks
 * Includes CJK learning preferences, phonetic display settings, and learning session state.
 */
export type UserLanguagePairSettings = {
  cjkLearning?: CjkLearningPreferences;
  phonetic?: PhoneticPreferences;
  learning?: LearningSessionPreferences;
};

/**
 * A language pair entry in the user's profile.
 *
 * @remarks
 * Users can have multiple language pairs, each with its own settings.
 */
export type UserLanguagePairEntry = {
  id: string;
  pair: LanguagePair;
  createdAt: string;
  settings?: UserLanguagePairSettings;
};
