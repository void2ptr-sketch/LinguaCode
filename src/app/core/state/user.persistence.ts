import { Injectable } from '@angular/core';
import type { User } from '../models';
import {
  createDefaultLanguagePairPreferences,
  normalizeUserPreferences,
} from '../data/user/user-language-pair.utils';

export const USER_STORAGE_KEY = 'lingua-code.user';

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

export { normalizeUserPreferences, createDefaultLanguagePairPreferences };
