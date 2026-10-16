import { Injectable, computed, inject, signal } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { getApiErrorMessage } from '../../../shared/api/api-error.utils';
import { AuthApiService } from '../api/auth-api.service';
import { AuthTokenStorage } from './auth-token.storage';
import { initialAuthState, isAccessTokenExpired } from '../model/auth-state';
import type { AuthState, LoginCredentials } from '../model/auth.types';

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
      this.#state.set({ status: 'authenticated', user: null, tokens, error: null });
      return;
    }
    await this.refreshSession();
  }

  /** Выполняет вход и сохраняет сессию. Возвращает `true` при успехе. */
  async login(credentials: LoginCredentials): Promise<boolean> {
    this.#state.update((s) => ({ ...s, status: 'authenticating', error: null }));
    try {
      const session = await this.authApi.login(credentials);
      this.tokenStorage.write(session.tokens);
      this.#state.set({
        status: 'authenticated',
        user: session.user,
        tokens: session.tokens,
        error: null,
      });
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
        this.#state.update((s) => ({
          ...s,
          status: 'authenticated',
          tokens: newTokens,
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
