/**
 * Типы аутентификации.
 *
 * @remarks
 * Модель сессии: пользователь, токены доступа и refresh-токен.
 * Токены хранятся в sessionStorage (см. `AuthTokenStorage`).
 */

/** Статус аутентификации. */
export type AuthStatus = 'anonymous' | 'authenticating' | 'authenticated' | 'refreshing';

/** Пользователь, полученный из сессии. */
export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
};

/** Пара токенов доступа. */
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Результат успешного входа (соответствует backend AuthResponse). */
export type AuthSession = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

/** Учётные данные для входа. */
export type LoginCredentials = {
  email: string;
  password: string;
};

/** Состояние auth-стора. */
export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  error: string | null;
};
