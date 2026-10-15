import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, ApiErrorKind, HttpApiError } from './api.types';

const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка при обращении к серверу';
const DEFAULT_TIMEOUT_MESSAGE = 'Превышено время ожидания ответа от сервера';
const DEFAULT_OFFLINE_MESSAGE = 'Нет соединения с интернетом';

export const parseApiErrorBody = (error: HttpErrorResponse): ApiErrorBody | null => {
  const body = error.error;

  if (typeof body === 'string' && body.trim()) {
    return { message: body };
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as ApiErrorBody).message;
    if (typeof message === 'string' && message.trim()) {
      return body as ApiErrorBody;
    }
  }

  return null;
};

const createHttpApiError = (
  message: string,
  kind: ApiErrorKind,
  retryable: boolean,
  status = 0,
  body: ApiErrorBody | null = null,
): HttpApiError => Object.assign(new Error(message), { status, body, kind, retryable });

const isRxjsTimeoutError = (error: Error): boolean =>
  error.name === 'TimeoutError' ||
  error.message.includes('Timeout has occurred') ||
  error.message.toLowerCase().includes('timeout');

/**
 * Normalises any error value into a structured `HttpApiError`.
 *
 * @remarks
 * Classifies the failure: `network` — transport-level failure
 * (`ProgressEvent` on fetch/XHR); `api` — server responded with an HTTP error;
 * `timeout` — the request exceeded the allowed time; `unknown` — anything else.
 * `retryable` is `true` for 5xx, transport, and timeout failures.
 *
 * @param error - The error value to normalise.
 * @returns An `HttpApiError` with `status`, `body`, `kind`, and `retryable`.
 */
export const toHttpApiError = (error: unknown): HttpApiError => {
  if (isHttpApiError(error)) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const body = parseApiErrorBody(error);
    const message = body?.message ?? error.message ?? DEFAULT_ERROR_MESSAGE;

    if (error.error instanceof ProgressEvent) {
      // Transport-level failure (fetch/XHR): DNS, CORS, connection reset.
      return createHttpApiError(message, 'network', true, error.status, body);
    }

    const retryable = error.status >= 500 || error.status === 0;
    return createHttpApiError(message, 'api', retryable, error.status, body);
  }

  if (error instanceof Error) {
    if (isRxjsTimeoutError(error)) {
      return createHttpApiError(error.message || DEFAULT_TIMEOUT_MESSAGE, 'timeout', true, 0, null);
    }

    return createHttpApiError(error.message, 'unknown', false, 0, null);
  }

  return createHttpApiError(DEFAULT_ERROR_MESSAGE, 'unknown', false, 0, null);
};

/** Creates a classified timeout error for the timeout interceptor. */
export const createTimeoutApiError = (): HttpApiError =>
  createHttpApiError(DEFAULT_TIMEOUT_MESSAGE, 'timeout', true, 0, null);

/** Creates a classified offline error for the offline interceptor. */
export const createOfflineApiError = (): HttpApiError =>
  createHttpApiError(DEFAULT_OFFLINE_MESSAGE, 'offline', false, 0, null);

export const getApiErrorMessage = (error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string => {
  const apiError = toHttpApiError(error);

  if (apiError.status === 0 && apiError.body === null && !(error instanceof Error)) {
    return fallback;
  }

  return apiError.message || fallback;
};

export const isHttpApiError = (error: unknown): error is HttpApiError => {
  return error instanceof Error && 'status' in error && typeof error.status === 'number';
};

/** Whether retrying the failed request may succeed. */
export const isRetryableError = (error: unknown): boolean => toHttpApiError(error).retryable;

/** Whether the failure is a transport-level network error. */
export const isNetworkError = (error: unknown): boolean => toHttpApiError(error).kind === 'network';

/** Whether the request exceeded the allowed time. */
export const isTimeoutError = (error: unknown): boolean => toHttpApiError(error).kind === 'timeout';

/** Whether the client is known to be offline. */
export const isOfflineError = (error: unknown): boolean => toHttpApiError(error).kind === 'offline';
