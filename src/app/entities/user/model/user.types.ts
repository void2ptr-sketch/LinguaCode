import type { CardAppearance } from '../../card/model/card.types';
import type { AppColorScheme } from '../../../shared/theme/app-color-scheme.types';
import type { LearningProficiencyLevel } from '../../learning/model/learning-proficiency.types';
import type { LanguagePair } from '../../language-pair/model/language-pair.types';
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
  /** ID of the currently active language pair (undefined when no pairs remain). */
  activeLanguagePairId: string | undefined;
  /**
   * Per-mirror-group active pair direction: mirror-group key (sorted codes,
   * see `buildMirrorGroupKey`) → the exact direction ({ known, learning })
   * that is highlighted as active within that mirror pair group.
   *
   * @remarks
   * Scoped per mirror group so that activation events within one mirror
   * pair (e.g. EN↔RU) never affect cards of other mirror pairs (e.g.
   * JA↔ZH). Optional for backward compatibility with persisted profiles.
   */
  activeByMirrorGroup?: Record<string, LanguagePair>;
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
