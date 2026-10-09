import { HttpInterceptorFn } from '@angular/common/http';
import { isApiRequest } from './api-url';

/** Storage key for the authentication token in sessionStorage. */
export const AUTH_TOKEN_STORAGE_KEY = 'lingua-code.auth-token';

/**
 * HTTP interceptor that adds the Bearer token to API requests.
 *
 * @remarks
 * Reads the token from `sessionStorage` and attaches it as an `Authorization` header.
 * Non-API requests are passed through unchanged.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The cloned request with the Authorization header (if token exists).
 */
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
