import { Injectable } from '@angular/core';
import type { User } from '../models';
import { normalizeLanguagePair } from '../data/language-pair.utils';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';
import type { UserPreferences } from '../models/user.types';

export const USER_STORAGE_KEY = 'lingua-code.user';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'azure-blue',
  fontSize: 'md',
  languagePair: DEFAULT_LANGUAGE_PAIR,
};

export function normalizeUserPreferences(
  preferences?: Partial<UserPreferences> | null,
): UserPreferences {
  return {
    theme: preferences?.theme ?? DEFAULT_PREFERENCES.theme,
    fontSize: preferences?.fontSize ?? DEFAULT_PREFERENCES.fontSize,
    languagePair: normalizeLanguagePair(preferences?.languagePair),
  };
}

@Injectable({ providedIn: 'root' })
export class UserPersistence {
  load(): User | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<User>;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return {
        id: typeof parsed.id === 'string' ? parsed.id : 'local-user',
        displayName: typeof parsed.displayName === 'string' ? parsed.displayName : 'Ученик',
        preferences: normalizeUserPreferences(parsed.preferences),
      };
    } catch {
      return null;
    }
  }

  save(user: User): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}
