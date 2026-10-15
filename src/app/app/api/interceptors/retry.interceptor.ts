import { HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';
import { isApiRequest } from '../../../shared/api/api-url';
import { isRetryableError } from '../../../shared/api/api-error.utils';

/** Maximum number of automatic retries for idempotent GET requests. */
const MAX_RETRIES = 2;
/** Base delay before the first retry (ms); grows exponentially. */
const BASE_DELAY_MS = 250;

/**
 * HTTP interceptor that retries idempotent GET requests with exponential backoff.
 *
 * @remarks
 * Only retries `GET` requests to the API, and only when the failure is
 * retryable (5xx, network, or timeout — see `isRetryableError`). Non-retryable
 * errors (4xx, offline) fail immediately.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The observable with automatic retry applied.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !isApiRequest(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, retryCount: number) => {
        if (!isRetryableError(error)) {
          return throwError(() => error);
        }

        return timer(BASE_DELAY_MS * 2 ** (retryCount - 1));
      },
    }),
  );
};
