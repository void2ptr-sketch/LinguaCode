import { Injectable, computed, inject, signal } from '@angular/core';

import {
  buildMirrorGroupKey,
  formatLanguagePair,
  isContentLanguage,
  languagePairsEqual,
  normalizeLanguagePair,
} from '../../language-pair/lib/language-pair.utils';
import {
  createDefaultLanguagePairPreferences,
  createUserLanguagePairEntry,
  defaultSettingsForPair,
  findLanguagePairEntryId,
  mergeLanguagePairSettings,
  resolveCjkLearningForPair,
  resolveLearningSessionForPair,
  resolvePhoneticForPair,
} from '../lib/user-language-pair.utils';
import { isAllowedFontSize, sanitizePlainText, sanitizeTheme } from '../../../shared/security';
import { normalizeColorScheme } from '../lib/app-color-scheme.utils';
import { normalizeCardFocusFullscreen } from '../../card/utils/card-focus-preference.utils';
import { normalizeLearningProficiencyLevel } from '../../learning/lib/learning-proficiency.utils';
import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type { LearningSessionPreferences } from '../../learning/model';
import type { User, UserLanguagePairEntry, UserLanguagePairSettings, UserPreferences } from './';
import { DEFAULT_LEARNING_PROFICIENCY_LEVEL } from '../../learning/model';
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
   * The currently active language pair entry.
   *
   * @remarks
   * Returns `null` when no language pairs are configured or when the
   * persisted `activeLanguagePairId` is stale. There is no silent fallback
   * to the first entry: an invalid active id must never highlight an
   * unrelated card.
   */
  readonly activeLanguagePairEntry = computed(() => {
    const pairs = this.languagePairs();
    const activeId = this.activeLanguagePairId();
    return pairs.find((entry) => entry.id === activeId) ?? null;
  });

  /**
   * Per-mirror-group active pair directions.
   *
   * @remarks
   * Maps a mirror-group key (see `buildMirrorGroupKey`) to the exact
   * direction that is highlighted as active within that mirror pair group.
   * Scoped per group so that activation events within one mirror pair
   * (e.g. EN↔RU) never affect cards of other mirror pairs (e.g. JA↔ZH).
   */
  readonly activeByMirrorGroup = computed(() => this.user().preferences.activeByMirrorGroup ?? {});

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
    const previous = this.languagePairs().find((entry) => entry.id === activeId);

    this.userState.update((user) => {
      const groupMarkers = { ...(user.preferences.activeByMirrorGroup ?? {}) };

      // Drop a stale group marker pointing at the previous direction of the
      // active entry, then mark the new direction as active in its group.
      if (previous) {
        const previousKey = buildMirrorGroupKey(previous.pair.known, previous.pair.learning);
        const previousMarker = groupMarkers[previousKey];
        if (previousMarker && languagePairsEqual(previousMarker, previous.pair)) {
          delete groupMarkers[previousKey];
        }
      }
      groupMarkers[buildMirrorGroupKey(normalized.known, normalized.learning)] = { ...normalized };

      return {
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
          activeByMirrorGroup: groupMarkers,
        },
      };
    });
    this.persist();
  }

  /**
   * Adds a new language pair to the user's profile.
   *
   * @param pair - The language pair to add (known → learning).
   * @param options - `activate: false` adds the pair without changing the
   *        global active pair or any mirror-group highlight (default `true`).
   * @returns The entry ID of the (possibly pre-existing) pair, or `''` when rejected.
   * @remarks If a pair with the same known/learning languages already exists
   * and activation is requested, it becomes active instead of duplicating.
   */
  addLanguagePair(pair: LanguagePair, options?: { activate?: boolean }): string {
    if (
      !isContentLanguage(pair.known) ||
      !isContentLanguage(pair.learning) ||
      pair.known === pair.learning
    ) {
      return '';
    }

    const normalized: LanguagePair = { known: pair.known, learning: pair.learning };
    const existingId = findLanguagePairEntryId(this.languagePairs(), normalized);
    const activate = options?.activate ?? true;
    const groupKey = buildMirrorGroupKey(normalized.known, normalized.learning);

    if (existingId) {
      if (activate) {
        this.setActiveLanguagePair(existingId);
        this.setActivePairInGroup(groupKey, normalized);
      }
      return existingId;
    }

    const entry = createUserLanguagePairEntry(normalized);
    this.userState.update((user) => {
      const nextPreferences: UserPreferences = {
        ...user.preferences,
        languagePairs: [...user.preferences.languagePairs, entry],
      };
      if (activate) {
        nextPreferences.activeLanguagePairId = entry.id;
        nextPreferences.activeByMirrorGroup = {
          ...(user.preferences.activeByMirrorGroup ?? {}),
          [groupKey]: { ...normalized },
        };
      }
      return { ...user, preferences: nextPreferences };
    });
    this.persist();
    return entry.id;
  }

  /**
   * Sets the active pair highlight for a single mirror group.
   *
   * @param groupKey - Canonical mirror-group key (see `buildMirrorGroupKey`).
   * @param pair - The exact direction to highlight within that group.
   * @remarks
   * Scoped strictly to the given mirror group: cards of other mirror pairs
   * are never affected. Does not change the global active learning pair.
   */
  setActivePairInGroup(groupKey: string, pair: LanguagePair): void {
    if (
      !isContentLanguage(pair.known) ||
      !isContentLanguage(pair.learning) ||
      pair.known === pair.learning
    ) {
      return;
    }

    if (buildMirrorGroupKey(pair.known, pair.learning) !== groupKey) {
      return;
    }

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        activeByMirrorGroup: {
          ...(user.preferences.activeByMirrorGroup ?? {}),
          [groupKey]: { known: pair.known, learning: pair.learning },
        },
      },
    }));
    this.persist();
  }

  /**
   * Removes a language pair from the user's profile.
   *
   * @param id - The ID of the language pair entry to remove.
   * @remarks Cannot remove the last remaining pair. If the removed pair is active, the first remaining becomes active. If the removed pair was its mirror group's highlight, the highlight moves to the mirror sibling (when configured) or is cleared — never touching other groups.
   */
  removeLanguagePair(id: string): void {
    const pairs = this.languagePairs();
    if (pairs.length <= 1) {
      return;
    }

    const removed = pairs.find((entry) => entry.id === id);
    const nextPairs = pairs.filter((entry) => entry.id !== id);
    if (!removed || nextPairs.length === pairs.length) {
      return;
    }

    const groupKey = buildMirrorGroupKey(removed.pair.known, removed.pair.learning);
    const groupMarkers = { ...(this.user().preferences.activeByMirrorGroup ?? {}) };
    const groupMarker = groupMarkers[groupKey];

    if (groupMarker && languagePairsEqual(groupMarker, removed.pair)) {
      const sibling = nextPairs.find((entry) =>
        languagePairsEqual(entry.pair, {
          known: removed.pair.learning,
          learning: removed.pair.known,
        }),
      );
      if (sibling) {
        groupMarkers[groupKey] = { ...sibling.pair };
      } else {
        delete groupMarkers[groupKey];
      }
    }

    const nextActiveId =
      this.activeLanguagePairId() === id ? nextPairs[0].id : this.activeLanguagePairId();

    this.userState.update((user) => ({
      ...user,
      preferences: {
        ...user.preferences,
        languagePairs: nextPairs,
        activeLanguagePairId: nextActiveId,
        activeByMirrorGroup: groupMarkers,
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
