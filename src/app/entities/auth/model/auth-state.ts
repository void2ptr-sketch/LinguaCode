import type { AuthState, AuthTokens } from './auth.types';

/** Начальное состояние auth-стора. */
export const initialAuthState: AuthState = {
  status: 'anonymous',
  user: null,
  tokens: null,
  error: null,
};

/**
 * Проверяет, истёк ли access-токен.
 *
 * @param tokens - Пара токенов.
 * @param now - Текущее время (мс), по умолчанию `Date.now()`.
 * @returns `true`, если токен истёк (включая точное совпадение).
 */
export const isAccessTokenExpired = (tokens: AuthTokens, now = Date.now()): boolean =>
  tokens.expiresAt <= now;
