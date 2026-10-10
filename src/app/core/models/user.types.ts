import type { CardAppearance } from './card.types';
import type { AppColorScheme } from './app-color-scheme.types';
import type { LearningProficiencyLevel } from './learning-proficiency.types';
import type { UserLanguagePairEntry } from './user-language-pair.types';

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
