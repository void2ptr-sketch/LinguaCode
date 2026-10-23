import { extractJwtExpMs } from '../lib/jwt-exp';
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
 * @remarks
 * Извлекает `exp` claim из JWT-токена (backend использует стандартный JWT exp).
 *
 * @param tokens - Пара токенов.
 * @param now - Текущее время (мс), по умолчанию `Date.now()`.
 * @returns `true`, если токен истёк (включая точное совпадение).
 */
export const isAccessTokenExpired = (tokens: AuthTokens, now = Date.now()): boolean => {
  const exp = extractJwtExpMs(tokens.accessToken);
  if (exp === null) {
    // Не удалось извлечь exp — считаем токен истёкшим (безопасный fallback)
    return true;
  }
  return exp <= now;
};
