import { Injectable, computed, inject, signal } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { getApiErrorMessage } from '../../../shared/api/api-error.utils';
import { AuthApiService } from '../api/auth-api.service';
import { AuthTokenStorage } from './auth-token.storage';
import { initialAuthState, isAccessTokenExpired } from '../model/auth-state';
import type { AuthState, AuthTokens, LoginCredentials } from '../model/auth.types';
import { UserStore } from '../../user/model/user.store';

/** Extracts payload from a JWT token string. */
const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/**
 * Signal-стор аутентификации.
 *
 * @remarks
 * Единый источник правды о сессии: статус, пользователь, токены.
 * - `login` — вход через `AuthApiService`, сохранение токенов
 * - `logout` — выход (best-effort вызов API + очистка сессии)
 * - `restoreSession` — восстановление сессии при старте приложения
 * - `refreshSession` — обновление токенов с single-flight (один параллельный refresh)
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly userStore = inject(UserStore);
  private readonly logger = inject(AppLoggerService);

  readonly #state = signal<AuthState>(initialAuthState);

  readonly status = computed(() => this.#state().status);
  readonly user = computed(() => this.#state().user);
  readonly tokens = computed(() => this.#state().tokens);
  readonly error = computed(() => this.#state().error);
  readonly isAuthenticated = computed(() => this.#state().status === 'authenticated');
  readonly isAuthenticating = computed(() => this.#state().status === 'authenticating');
  readonly accessToken = computed(() => this.#state().tokens?.accessToken ?? null);

  /** In-flight refresh, чтобы параллельные 401 не дублировали запрос. */
  #refreshPromise: Promise<boolean> | null = null;

  /**
   * Восстанавливает сессию из sessionStorage.
   * Если access-токен истёк — пытается обновить его через refresh-токен.
   */
  async restoreSession(): Promise<void> {
    const tokens = this.tokenStorage.read();
    if (!tokens) {
      this.#state.set(initialAuthState);
      return;
    }
    if (!isAccessTokenExpired(tokens)) {
      // Extract roles from the stored access token
      const payload = parseJwtPayload(tokens.accessToken);
      const roles = ((payload as Record<string, unknown>)['roles'] as string[] | undefined) ?? [];
      this.#state.set({
        status: 'authenticated',
        user: { id: 'restored', displayName: '', email: '', roles },
        tokens,
        error: null,
      });
      return;
    }
    await this.refreshSession();
  }

  /** Выполняет вход и сохраняет сессию. Возвращает `true` при успехе. */
  async login(credentials: LoginCredentials): Promise<boolean> {
    this.#state.update((s) => ({ ...s, status: 'authenticating', error: null }));
    try {
      const session = await this.authApi.login(credentials);
      // Backend AuthResponse: { userId, accessToken, refreshToken }
      // Mock additionally returns `displayName`
      const tokens: AuthTokens = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      };
      this.tokenStorage.write(tokens);

      // Extract roles from JWT access token
      const payload = parseJwtPayload(session.accessToken);
      const backendRoles =
        ((payload as Record<string, unknown>)['roles'] as string[] | undefined) ?? [];

      // Extract displayName from backend response if provided
      const backendDisplayName = (session as unknown as Record<string, unknown>)['displayName'];
      const userDisplayName =
        typeof backendDisplayName === 'string' && backendDisplayName ? backendDisplayName : '';

      this.#state.set({
        status: 'authenticated',
        user: {
          id: session.userId,
          displayName: userDisplayName,
          email: '',
          roles: backendRoles,
        },
        tokens,
        error: null,
      });

      // Sync displayName with UserStore so profile pages display it
      if (userDisplayName) {
        this.userStore.updateDisplayName(userDisplayName);
      }
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Не удалось войти');
      this.#state.update((s) => ({ ...s, status: 'anonymous', error: message }));
      this.logger.error('Auth login failed', error);
      return false;
    }
  }

  /** Выполняет выход: best-effort вызов API, затем очистка сессии. */
  async logout(): Promise<void> {
    try {
      await this.authApi.logout();
    } catch (error) {
      this.logger.warn('Auth logout request failed', error);
    } finally {
      this.tokenStorage.clear();
      this.#state.set(initialAuthState);
    }
  }

  /**
   * Обновляет токены через refresh-токен (single-flight).
   *
   * @returns `true`, если токены обновлены; `false` — refresh невозможен или неудачен.
   */
  refreshSession(): Promise<boolean> {
    if (this.#refreshPromise) {
      return this.#refreshPromise;
    }

    const tokens = this.tokenStorage.read();
    if (!tokens?.refreshToken) {
      this.#state.set(initialAuthState);
      return Promise.resolve(false);
    }

    this.#state.update((s) => ({ ...s, status: 'refreshing' }));
    this.#refreshPromise = this.authApi
      .refresh(tokens.refreshToken)
      .then((newTokens) => {
        this.tokenStorage.write(newTokens);
        // Extract roles from the refreshed token
        const payload = parseJwtPayload(newTokens.accessToken);
        const roles = ((payload as Record<string, unknown>)['roles'] as string[] | undefined) ?? [];
        this.#state.update((s) => ({
          ...s,
          status: 'authenticated',
          tokens: newTokens,
          user: { ...s.user!, roles },
          error: null,
        }));
        return true;
      })
      .catch((error) => {
        this.logger.warn('Auth refresh failed', error);
        this.tokenStorage.clear();
        this.#state.set(initialAuthState);
        return false;
      })
      .finally(() => {
        this.#refreshPromise = null;
      });

    return this.#refreshPromise;
  }
}
