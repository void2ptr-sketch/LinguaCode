import { Injectable, computed, inject, signal } from '@angular/core';

import { formatLanguagePair, normalizeLanguagePair } from '../data/language-pair.utils';
import { isAllowedFontSize, sanitizePlainText, sanitizeTheme } from '../security';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';
import type { LanguagePair, User, UserPreferences } from '../models';
import { UserPersistence } from './user.persistence';

const DEFAULT_USER: User = {
  id: 'local-user',
  displayName: 'Ученик',
  preferences: {
    theme: 'azure-blue',
    fontSize: 'md',
    languagePair: DEFAULT_LANGUAGE_PAIR,
  },
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly persistence = inject(UserPersistence);
  private readonly userState = signal<User>(this.persistence.load() ?? DEFAULT_USER);

  readonly user = this.userState.asReadonly();
  readonly displayName = computed(() => this.user().displayName);
  readonly preferences = computed(() => this.user().preferences);
  readonly languagePair = computed(() => this.user().preferences.languagePair);
  readonly languagePairLabel = computed(() => formatLanguagePair(this.languagePair()));

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

      if (preferences.languagePair !== undefined) {
        nextPreferences.languagePair = normalizeLanguagePair(preferences.languagePair);
      }

      return {
        ...user,
        preferences: nextPreferences,
      };
    });
    this.persist();
  }

  updateLanguagePair(languagePair: LanguagePair): void {
    this.updatePreferences({ languagePair: normalizeLanguagePair(languagePair) });
  }

  private patchUser(patch: Partial<User>): void {
    this.userState.update((user) => ({ ...user, ...patch }));
    this.persist();
  }

  private persist(): void {
    this.persistence.save(this.userState());
  }
}
