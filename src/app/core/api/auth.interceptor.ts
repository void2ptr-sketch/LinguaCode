import { HttpInterceptorFn } from '@angular/common/http';
import { isApiRequest } from './api-url';

export const AUTH_TOKEN_STORAGE_KEY = 'lingua-code.auth-token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
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
