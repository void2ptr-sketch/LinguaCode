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
 * При ответе 401 на API-запросе (кроме `/auth/*`) выполняет single-flight refresh
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
      if (!isHttpApiError(error) || error.status !== 401) {
        return throwError(() => error);
      }

      return from(authStore.refreshSession()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            return throwError(() => error);
          }
          const token = authStore.accessToken();
          if (!token) {
            return throwError(() => error);
          }
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
            }),
          );
        }),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
