import { Injectable, computed, inject, signal } from '@angular/core';

import { formatLanguagePair, isContentLanguage, normalizeLanguagePair } from '../data/language-pair.utils';
import {
  createDefaultLanguagePairPreferences,
  createUserLanguagePairEntry,
  defaultSettingsForPair,
  findLanguagePairEntryId,
  mergeLanguagePairSettings,
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../data/user-language-pair.utils';
import { isAllowedFontSize, sanitizePlainText, sanitizeTheme } from '../security';
import type {
  LanguagePair,
  User,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../models';
import { UserPersistence } from './user.persistence';

const DEFAULT_USER: User = {
  id: 'local-user',
  displayName: 'Ученик',
  preferences: {
    theme: 'azure-blue',
    fontSize: 'md',
    ...createDefaultLanguagePairPreferences(),
  },
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly persistence = inject(UserPersistence);
  private readonly userState = signal<User>(this.persistence.load() ?? DEFAULT_USER);

  readonly user = this.userState.asReadonly();
  readonly displayName = computed(() => this.user().displayName);
  readonly preferences = computed(() => this.user().preferences);
  readonly languagePairs = computed(() => this.user().preferences.languagePairs);
  readonly activeLanguagePairId = computed(() => this.user().preferences.activeLanguagePairId);

  readonly activeLanguagePairEntry = computed(() => {
    const pairs = this.languagePairs();
    const activeId = this.activeLanguagePairId();
    return pairs.find((entry) => entry.id === activeId) ?? pairs[0] ?? null;
  });

  readonly languagePair = computed(() => {
    const entry = this.activeLanguagePairEntry();
    return entry?.pair ?? createDefaultLanguagePairPreferences().languagePairs[0].pair;
  });

  readonly languagePairLabel = computed(() => formatLanguagePair(this.languagePair()));
  readonly cjkLearning = computed(() => resolveCjkLearningForPair(this.activeLanguagePairEntry()));
  readonly phonetic = computed(() => resolvePhoneticForPair(this.activeLanguagePairEntry()));

  updateDisplayName(displayName: string): void {
    const sanitized = sanitizePlainText(displayName);
    if (!sanitized) {
      return;
    }

    this.patchUser({ displayName: sanitized });
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.userState.update((user) => {
      const nextPreferences = { ...user.preferences };

      if (preferences.theme !== undefined) {
        nextPreferences.theme = sanitizeTheme(preferences.theme);
      }

      if (preferences.fontSize !== undefined && isAllowedFontSize(preferences.fontSize)) {
        nextPreferences.fontSize = preferences.fontSize;
      }

      return {
        ...user,
        preferences: nextPreferences,
      };
    });
    this.persist();
  }

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

  /** Обновляет настройки активной языковой пары. */
  updateActiveLanguagePairSettings(patch: Partial<UserLanguagePairSettings>): void {
    this.updateLanguagePairSettings(this.activeLanguagePairId(), patch);
  }

  /** Обновляет пару у активной записи (legacy API для совместимости). */
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

  formatEntryLabel(entry: UserLanguagePairEntry): string {
    return formatLanguagePair(entry.pair);
  }

  isActiveEntry(entry: UserLanguagePairEntry): boolean {
    return entry.id === this.activeLanguagePairId();
  }

  private patchUser(patch: Partial<User>): void {
    this.userState.update((user) => ({ ...user, ...patch }));
    this.persist();
  }

  private persist(): void {
    this.persistence.save(this.userState());
  }
}
