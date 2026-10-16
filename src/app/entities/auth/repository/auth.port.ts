import type { AuthSession, AuthTokens, LoginCredentials } from '../model/auth.types';

/**
 * Порт аутентификации.
 *
 * @remarks
 * Контракт data-слоя для auth: вход, обновление токенов, выход.
 * Реализуется `AuthApiService` (HTTP) и может быть заменён mock-реализацией.
 */
export type AuthPort = {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(): Promise<void>;
};
