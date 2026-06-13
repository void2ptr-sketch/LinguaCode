import { Injectable, computed, signal } from '@angular/core';
import { isAllowedFontSize, sanitizePlainText, sanitizeTheme } from '../security';
import { CardAppearance, User } from '../models';

const DEFAULT_USER: User = {
  id: 'local-user',
  displayName: 'Ученик',
  preferences: {
    theme: 'azure-blue',
    fontSize: 'md',
  },
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userState = signal<User>(DEFAULT_USER);

  readonly user = this.userState.asReadonly();
  readonly displayName = computed(() => this.user().displayName);
  readonly preferences = computed(() => this.user().preferences);

  updateDisplayName(displayName: string): void {
    const sanitized = sanitizePlainText(displayName);
    if (!sanitized) {
      return;
    }

    this.userState.update((user) => ({ ...user, displayName: sanitized }));
  }

  updatePreferences(preferences: Partial<CardAppearance>): void {
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
  }
}
