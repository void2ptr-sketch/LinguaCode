import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { AuthSession, AuthTokens, LoginCredentials } from '../model/auth.types';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';
import type { AuthPort } from '../repository/auth.port';

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
      this.http.post<ApiResponse<AuthSession>>(buildApiUrl('/auth/login'), credentials),
    ).then((response) => response.data);
  }

  refresh(refreshToken: string): Promise<AuthTokens> {
    return firstValueFrom(
      this.http.post<ApiResponse<AuthTokens>>(buildApiUrl('/auth/refresh'), { refreshToken }),
    ).then((response) => response.data);
  }

  logout(): Promise<void> {
    return firstValueFrom(this.http.post<ApiResponse<null>>(buildApiUrl('/auth/logout'), {})).then(
      () => undefined,
    );
  }
}
