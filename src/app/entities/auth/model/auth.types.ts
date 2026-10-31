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
  /** Array of role codes (e.g. ['ROLE_USER', 'ROLE_ADMIN']). */
  roles?: string[];
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

/** Запрос на отправку кода восстановления пароля. */
export type ForgotPasswordRequest = {
  email: string;
};

/** Ответ: код восстановления отправлен на email (строка). */
export type ForgotPasswordResponse = string;

/** Запрос на проверку кода восстановления. */
export type VerifyCodeRequest = {
  email: string;
  code: string;
};

/** Ответ: токен для сброса пароля. */
export type VerifyCodeResponse = {
  resetToken: string;
};

/** Запрос на сброс пароля. */
export type ResetPasswordRequest = {
  resetToken: string;
  newPassword: string;
};
