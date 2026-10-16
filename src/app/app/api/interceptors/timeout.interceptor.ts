import { HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { isApiRequest } from '../../../shared/api/api-url';
import { createTimeoutApiError } from '../../../shared/api/api-error.utils';

/** Maximum time to wait for an API response (ms). */
const API_REQUEST_TIMEOUT_MS = 15_000;

/**
 * HTTP interceptor that enforces a response timeout for API requests.
 *
 * @remarks
 * When the request does not complete within `API_REQUEST_TIMEOUT_MS`, the
 * error is normalized into a classified timeout `HttpApiError` (kind
 * `'timeout'`, retryable). Non-API requests are passed through unchanged.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The observable with timeout applied.
 */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    timeout({ each: API_REQUEST_TIMEOUT_MS }),
    catchError((error: unknown) => {
      if (error instanceof TimeoutError) {
        return throwError(() => createTimeoutApiError());
      }

      return throwError(() => error);
    }),
  );
};
