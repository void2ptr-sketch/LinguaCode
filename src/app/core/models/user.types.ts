import { CardAppearance } from './card.types';
import type { AppColorScheme } from '../theme/app-color-scheme.types';
import type { LearningProficiencyLevel } from './learning-proficiency.types';
import type { UserLanguagePairEntry } from './user-language-pair.types';

export type {
  LearningProficiencyLevel,
  LearningProficiencyOption,
} from './learning-proficiency.types';
export {
  LEARNING_PROFICIENCY_LEVELS,
  DEFAULT_LEARNING_PROFICIENCY_LEVEL,
} from './learning-proficiency.types';

export type { UserLanguagePairEntry, UserLanguagePairSettings } from './user-language-pair.types';
export type { CjkLearningPreferences, PhoneticPreferences } from './phonetic-content.types';
export {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from './phonetic-content.types';

export type { AppColorScheme } from '../theme/app-color-scheme.types';
export { DEFAULT_APP_COLOR_SCHEME } from '../theme/app-color-scheme.types';

/**
 * User preferences including display settings, proficiency level, and language pairs.
 *
 * @remarks
 * Extends `CardAppearance` with theme, fullscreen mode, and language pair configuration.
 * Persisted via `UserStore` to localStorage.
 */
export type UserPreferences = CardAppearance & {
  /** Color scheme: light or dark mode. */
  colorScheme: AppColorScheme;
  /** Full-screen card mode on the Practice tab; also persisted when toggled manually. */
  cardFocusFullscreen: boolean;
  /** User's proficiency level in the learning language; affects answer checking strictness. */
  learningProficiencyLevel: LearningProficiencyLevel;
  /** All configured language pairs for this user. */
  languagePairs: readonly UserLanguagePairEntry[];
  /** ID of the currently active language pair. */
  activeLanguagePairId: string;
};

/**
 * User profile with display name and preferences.
 *
 * @remarks
 * Managed by `UserStore`. The `id` field is used for scoping learning results.
 */
export type User = {
  /** Unique user identifier (e.g. 'local-user'). */
  id: string;
  /** Display name shown in the UI. */
  displayName: string;
  /** User preferences including theme, language pairs, and proficiency. */
  preferences: UserPreferences;
};
