import { Injectable } from '@angular/core';
import type { User } from '../models';
import {
  createDefaultLanguagePairPreferences,
  normalizeUserPreferences,
} from '../domain/user/user-language-pair.utils';

/**
 * LocalStorage key for user preferences.
 */
export const USER_STORAGE_KEY = 'lingua-code.user';

/**
 * Persists user preferences to and from LocalStorage.
 *
 * @remarks
 * Uses a simple JSON serialization strategy with fallback defaults
 * for missing or malformed data.
 */
@Injectable({ providedIn: 'root' })
export class UserPersistence {
  /**
   * Loads the user from LocalStorage.
   *
   * @returns The parsed user object, or `null` if no data is stored or parsing fails.
   * @remarks
   * Applies fallback defaults: `'local-user'` for ID, `'Ученик'` for display name.
   * Normalizes language pair preferences via `normalizeUserPreferences`.
   */
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

  /**
   * Saves the user to LocalStorage.
   *
   * @param user - The user object to persist.
   */
  save(user: User): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export { normalizeUserPreferences, createDefaultLanguagePairPreferences };
