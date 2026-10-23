import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { AuthSession, AuthTokens, LoginCredentials } from '../model/auth.types';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { AuthPort } from '../repository/auth.port';

/**
 * Backend DTO для ответа аутентификации (соответствует Java AuthResponse).
 */
type BackendAuthResponse = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

/**
 * API-сервис аутентификации.
 *
 * @remarks
 * Реализует `AuthPort` поверх HTTP:
 * - `POST /auth/login` — вход по email/password
 * - `POST /auth/refresh` — обновление токенов по refresh-токену
 * - `POST /auth/logout` — выход (best-effort)
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService implements AuthPort {
  private readonly http = inject(HttpClient);

  login(credentials: LoginCredentials): Promise<AuthSession> {
    return firstValueFrom(
      this.http.post<ApiResponse<BackendAuthResponse>>(buildApiUrl('/auth/login'), credentials),
    ).then((response) => response.data);
  }

  refresh(refreshToken: string): Promise<AuthTokens> {
    return firstValueFrom(
      this.http.post<ApiResponse<BackendAuthResponse>>(buildApiUrl('/auth/refresh'), {
        refreshToken,
      }),
    ).then((response) => {
      const { accessToken, refreshToken: rt } = response.data;
      return { accessToken, refreshToken: rt };
    });
  }

  logout(): Promise<void> {
    return firstValueFrom(this.http.post<ApiResponse<null>>(buildApiUrl('/auth/logout'), {})).then(
      () => undefined,
    );
  }
}
