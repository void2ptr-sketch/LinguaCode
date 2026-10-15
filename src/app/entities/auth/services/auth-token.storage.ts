import { Injectable } from '@angular/core';

import type { AuthTokens } from '../model/auth.types';

/** Ключ хранения токенов в sessionStorage. */
export const AUTH_TOKEN_STORAGE_KEY = 'lingua-code.auth-token';

/**
 * Хранение токенов аутентификации.
 *
 * @remarks
 * Сериализует `AuthTokens` в sessionStorage. Сессия живёт в рамках вкладки —
 * осознанный компромисс безопасности: токены не попадают в localStorage
 * и не переживают закрытие вкладки.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenStorage {
  read(): AuthTokens | null {
    const raw = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthTokens;
    } catch {
      return null;
    }
  }

  /** Возвращает access-токен или `null`, если сессия отсутствует или повреждена. */
  readAccessToken(): string | null {
    return this.read()?.accessToken ?? null;
  }

  write(tokens: AuthTokens): void {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  }

  clear(): void {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}