import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isApiRequest } from '../../../shared/api/api-url';
import { AuthTokenStorage } from '../../../entities/auth/services/auth-token.storage';

export { AUTH_TOKEN_STORAGE_KEY } from '../../../entities/auth/services/auth-token.storage';

/**
 * HTTP-интерсептор, добавляющий Bearer-токен к API-запросам.
 *
 * @remarks
 * Читает access-токен через `AuthTokenStorage` (sessionStorage) и добавляет его
 * как заголовок `Authorization`. Не-API запросы проходят без изменений.
 *
 * @param req - Исходящий HTTP-запрос.
 * @param next - Следующий интерсептор в цепочке.
 * @returns Клонированный запрос с заголовком Authorization (если токен есть).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const token = inject(AuthTokenStorage).readAccessToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
