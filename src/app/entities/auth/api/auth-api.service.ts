import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  AuthSession,
  AuthTokens,
  LoginCredentials,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  ResetPasswordRequest,
} from '../model/auth.types';
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
 * - `POST /auth/forgot-password` — запрос кода восстановления
 * - `POST /auth/verify-code` — проверка кода восстановления
 * - `POST /auth/reset-password` — сброс пароля
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

  /** Запрашивает код подтверждения на email для восстановления пароля. */
  forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return firstValueFrom(
      this.http.post<ApiResponse<ForgotPasswordResponse>>(
        buildApiUrl('/auth/forgot-password'),
        request,
      ),
    ).then((response) => response.data);
  }

  /** Проверяет код подтверждения и возвращает токен для сброса пароля. */
  verifyResetCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return firstValueFrom(
      this.http.post<ApiResponse<VerifyCodeResponse>>(buildApiUrl('/auth/verify-code'), {
        ...request,
      }),
    ).then((response) => response.data);
  }

  /** Сбрасывает пароль по проверенному токену. */
  resetPassword(request: ResetPasswordRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<ApiResponse<null>>(buildApiUrl('/auth/reset-password'), request),
    ).then(() => undefined);
  }
}
