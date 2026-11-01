import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { isApiRequest } from '../../../shared/api/api-url';
import { isHttpApiError } from '../../../shared/api/api-error.utils';
import { AuthStore } from '../../../entities/auth/services/auth.store';

/**
 * HTTP-интерсептор обновления сессии.
 *
 * @remarks
 * При ответе 401 или 403 на API-запросе (кроме `/auth/*`) выполняет single-flight refresh
 * через `AuthStore` и повторяет исходный запрос с новым токеном.
 * Если refresh невозможен (нет сессии) или неудачен — пробрасывает исходную ошибку.
 *
 * @param req - Исходящий HTTP-запрос.
 * @param next - Следующий интерсептор в цепочке.
 * @returns Observable с ответом (или повторным запросом после refresh).
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || req.url.includes('/auth/')) {
    return next(req);
  }

  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!isHttpApiError(error)) {
        return throwError(() => error);
      }

      const status = error.status;
      // Treat 403 as a potential expired-token signal (backend may return 403
      // instead of 401 when the JWT has expired or the token is invalid).
      if (status !== 401 && status !== 403) {
        return throwError(() => error);
      }

      // Debug: log what we caught so we can see if refresh is triggered
      console.warn('[authRefresh] caught', status, req.method, req.url, error.message);

      return from(authStore.refreshSession()).pipe(
        switchMap((refreshed) => {
          console.log('[authRefresh] refreshed:', refreshed);
          if (!refreshed) {
            console.warn('[authRefresh] refresh failed, re-throwing');
            return throwError(() => error);
          }
          const token = authStore.accessToken();
          if (!token) {
            console.warn('[authRefresh] no token after refresh');
            return throwError(() => error);
          }
          console.log('[authRefresh] retrying with new token');
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
            }),
          );
        }),
        catchError(() => {
          console.warn('[authRefresh] refresh threw, re-throwing original');
          return throwError(() => error);
        }),
      );
    }),
  );
};
