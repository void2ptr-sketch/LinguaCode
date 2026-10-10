import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { isApiRequest } from '../api-url';
import { toHttpApiError } from '../errors/api-error.utils';

/**
 * HTTP interceptor that transforms errors into structured `HttpApiError` objects.
 *
 * @remarks
 * Only applies to API requests (non-API errors are rethrown as-is).
 * The transformed error includes HTTP status code and parsed error body.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The observable with transformed error for API requests.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!isApiRequest(req.url)) {
        return throwError(() => error);
      }

      return throwError(() => toHttpApiError(error));
    }),
  );
};
