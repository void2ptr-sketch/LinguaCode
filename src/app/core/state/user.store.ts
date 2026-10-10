import { Injectable, computed, inject, signal } from '@angular/core';

import {
  formatLanguagePair,
  isContentLanguage,
  normalizeLanguagePair,
} from '../domain/language-pair/language-pair.utils';
import {
  createDefaultLanguagePairPreferences,
  createUserLanguagePairEntry,
  defaultSettingsForPair,
  findLanguagePairEntryId,
  mergeLanguagePairSettings,
  resolveCjkLearningForPair,
  resolveLearningSessionForPair,
  resolvePhoneticForPair,
} from '../domain/user/user-language-pair.utils';
import { isAllowedFontSize, sanitizePlainText, sanitizeTheme } from '../security';
import { normalizeColorScheme } from '../theme/app-color-scheme.utils';
import { normalizeCardFocusFullscreen } from '../repositories/cards/utils/card-focus-preference.utils';
import { normalizeLearningProficiencyLevel } from '../domain/learning/learning-proficiency.utils';
import type {
  LanguagePair,
  LearningSessionPreferences,
  User,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../models';
import { DEFAULT_LEARNING_PROFICIENCY_LEVEL } from '../models';
import { UserPersistence } from './user.persistence';

/** Default user object used when no persisted data exists. */
const DEFAULT_USER: User = {
  id: 'local-user',
  displayName: 'Ученик',
  preferences: {
    theme: 'azure-blue',
    fontSize: 'md',
    colorScheme: 'light',
    cardFocusFullscreen: false,
    learningProficiencyLevel: DEFAULT_LEARNING_PROFICIENCY_LEVEL,
    ...createDefaultLanguagePairPreferences(),
  },
};

/**
 * Central store for user profile and preferences.
 *
 * @remarks
 * Persists data to localStorage via `UserPersistence`. Manages language pairs, display settings,
 * and learning session state. Uses Angular Signals for reactive state.
 */
@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly persistence = inject(UserPersistence);
  private readonly userState = signal<User>(this.persistence.load() ?? DEFAULT_USER);

  /** Readonly signal of the current user. */
  readonly user = this.userState.asReadonly();
  /** Display name derived from user preferences. */
  readonly displayName = computed(() => this.user().displayName);

  /** Full preferences object derived from user. */
  readonly preferences = computed(() => this.user().preferences);

  /** Current learning proficiency level. */
  readonly learningProficiencyLevel = computed(
    () => this.user().preferences.learningProficiencyLevel,
  );

  /** All configured language pairs. */
  readonly languagePairs = computed(() => this.user().preferences.languagePairs);

  /** ID of the currently active language pair. */
  readonly activeLanguagePairId = computed(() => this.user().preferences.activeLanguagePairId);

  /**
   * The currently active language pair entry (or the first one as fallback).
   *
   * @remarks
   * Returns `null` only if no language pairs are configured.
   */
  readonly activeLanguagePairEntry = computed(() => {
    const pairs = this.languagePairs();
    const activeId = this.activeLanguagePairId();
    return pairs.find((entry) => entry.id === activeId) ?? pairs[0] ?? null;
  });

  /** Resolved language pair for the active entry. */
  readonly languagePair = computed(() => {
    const entry = this.activeLanguagePairEntry();
    return entry?.pair ?? createDefaultLanguagePairPreferences().languagePairs[0].pair;
  });

  /** Human-readable label for the active language pair (e.g. "Русский → English"). */
  readonly languagePairLabel = computed(() => formatLanguagePair(this.languagePair()));

  /** CJK learning preferences for the active language pair. */
  readonly cjkLearning = computed(() => resolveCjkLearningForPair(this.activeLanguagePairEntry()));

  /** Phonetic display preferences for the active language pair. */
  readonly phonetic = computed(() => resolvePhoneticForPair(this.activeLanguagePairEntry()));

  /** Learning session preferences for the active language pair. */
  readonly learningSession = computed(() =>
    resolveLearningSessionForPair(this.activeLanguagePairEntry()),
  );

  /**
   * Updates the user's display name.
   *
   * @param displayName - The new display name (will be sanitized).
   */
  updateDisplayName(displayName: string): void {
    const sanitized = sanitizePlainText(displayName);
    if (!sanitized) {
      return;
    }

    this.patchUser({ displayName: sanitized });
  }

  /**
   * Updates user preferences with sanitization and normalization.
   *
   * @param preferences - Partial preferences to merge with existing ones.
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.userState.update((user) => {
      const nextPreferences = { ...user.preferences };

      if (preferences.theme !== undefined) {
        nextPreferences.theme = sanitizeTheme(preferences.theme);
      }

      if (preferences.fontSize !== undefined && isAllowedFontSize(preferences.fontSize)) {
        nextPreferences.fontSize = preferences.fontSize;
      }

      if (preferences.colorScheme !== undefined) {
        nextPreferences.colorScheme = normalizeColorScheme(preferences.colorScheme);
      }

      if (preferences.cardFocusFullscreen !== undefined) {
        nextPreferences.cardFocusFullscreen = normalizeCardFocusFullscreen(
          preferences.cardFocusFullscreen,
        );
      }

      if (preferences.learningProficiencyLevel !== undefined) {
        nextPreferences.learningProficiencyLevel = normalizeLearningProficiencyLevel(
          preferences.learningProficiencyLevel,
        );
      }

      return {
        ...user,
        preferences: nextPreferences,
      };
    });
    this.persist();
  }

  /**
   * Updates settings for a specific language pair entry.
   *
   * @param id - The ID of the language pair entry to update.
   * @param patch - Partial settings to merge.
   */
  updateLanguagePairSettings(id: string, patch: Partial<UserLanguagePairSettings>): void {
    const entry = this.languagePairs().find((item) => item.id === id);
    if (!entry) {
      return;
    }

    const nextSettings = mergeLanguagePairSettings(entry.pair, entry.settings, patch);
    if (!nextSettings) {
      return;
    }

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        languagePairs: user.preferences.languagePairs.map((item) =>
          item.id === id ? { ...item, settings: nextSettings } : item,
        ),
      },
    }));
    this.persist();
  }

  /**
   * Updates learning session preferences for the active language pair.
   *
   * @param patch - Partial learning session preferences to merge.
   */
  updateLearningSession(patch: Partial<LearningSessionPreferences>): void {
    this.updateActiveLanguagePairSettings({ learning: patch });
  }

  /**
   * Updates settings for the currently active language pair.
   *
   * @param patch - Partial settings to merge.
   */
  updateActiveLanguagePairSettings(patch: Partial<UserLanguagePairSettings>): void {
    this.updateLanguagePairSettings(this.activeLanguagePairId(), patch);
  }

  /**
   * Updates the language pair of the active entry (legacy API for compatibility).
   *
   * @param languagePair - The new language pair.
   */
  updateLanguagePair(languagePair: LanguagePair): void {
    const normalized = normalizeLanguagePair(languagePair);
    const activeId = this.activeLanguagePairId();

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        languagePairs: user.preferences.languagePairs.map((entry) =>
          entry.id === activeId
            ? {
                ...entry,
                pair: normalized,
                settings: defaultSettingsForPair(normalized) ?? entry.settings,
              }
            : entry,
        ),
      },
    }));
    this.persist();
  }

  /**
   * Adds a new language pair to the user's profile.
   *
   * @param pair - The language pair to add (known → learning).
   * @remarks If a pair with the same known/learning languages already exists, it becomes active instead.
   */
  addLanguagePair(pair: LanguagePair): void {
    if (
      !isContentLanguage(pair.known) ||
      !isContentLanguage(pair.learning) ||
      pair.known === pair.learning
    ) {
      return;
    }

    const normalized: LanguagePair = { known: pair.known, learning: pair.learning };
    const existingId = findLanguagePairEntryId(this.languagePairs(), normalized);

    if (existingId) {
      this.setActiveLanguagePair(existingId);
      return;
    }

    const entry = createUserLanguagePairEntry(normalized);
    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        languagePairs: [...user.preferences.languagePairs, entry],
        activeLanguagePairId: entry.id,
      },
    }));
    this.persist();
  }

  /**
   * Removes a language pair from the user's profile.
   *
   * @param id - The ID of the language pair entry to remove.
   * @remarks Cannot remove the last remaining pair. If the removed pair is active, the first remaining becomes active.
   */
  removeLanguagePair(id: string): void {
    const pairs = this.languagePairs();
    if (pairs.length <= 1) {
      return;
    }

    const nextPairs = pairs.filter((entry) => entry.id !== id);
    if (nextPairs.length === pairs.length) {
      return;
    }

    const nextActiveId =
      this.activeLanguagePairId() === id ? nextPairs[0].id : this.activeLanguagePairId();

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        languagePairs: nextPairs,
        activeLanguagePairId: nextActiveId,
      },
    }));
    this.persist();
  }

  /**
   * Sets the active language pair by ID.
   *
   * @param id - The ID of the language pair entry to activate.
   */
  setActiveLanguagePair(id: string): void {
    if (id === this.activeLanguagePairId()) {
      return;
    }

    if (!this.languagePairs().some((entry) => entry.id === id)) {
      return;
    }

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        activeLanguagePairId: id,
      },
    }));
    this.persist();
  }

  /**
   * Returns a human-readable label for a language pair entry.
   *
   * @param entry - The language pair entry.
   * @returns Formatted label (e.g. "Русский → English").
   */
  formatEntryLabel(entry: UserLanguagePairEntry): string {
    return formatLanguagePair(entry.pair);
  }

  /**
   * Checks whether a language pair entry is the currently active one.
   *
   * @param entry - The language pair entry to check.
   * @returns `true` if the entry's ID matches the active language pair ID.
   */
  isActiveEntry(entry: UserLanguagePairEntry): boolean {
    return entry.id === this.activeLanguagePairId();
  }

  /**
   * Applies a partial user patch and persists.
   *
   * @param patch - Partial user data to merge.
   */
  private patchUser(patch: Partial<User>): void {
    this.userState.update((user) => ({ ...user, ...patch }));
    this.persist();
  }

  /** Persists the current user state to localStorage. */
  private persist(): void {
    this.persistence.save(this.userState());
  }
}
