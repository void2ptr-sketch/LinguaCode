/**
 * Error body returned by the API.
 *
 * @remarks
 * Contains a human-readable message, optional error code, and additional details.
 */
export type ApiErrorBody = {
  message: string;
  code?: string;
  details?: unknown;
};

/**
 * Standard API response envelope.
 *
 * @typeParam T - The type of the response data payload.
 */
export type ApiResponse<T> = {
  data: T;
};

/**
 * Standard API list response envelope with optional total count.
 *
 * @typeParam T - The type of items in the list.
 */
export type ApiListResponse<T> = {
  data: readonly T[];
  total?: number;
};

/**
 * Category of an API failure.
 *
 * @remarks
 * Used to decide UX copy, retry behaviour, and reporting. `api` — the server
 * responded with an HTTP error; `network` — the request failed at the transport
 * layer; `timeout` — no response within the allowed time; `offline` — the
 * client is known to be offline; `unknown` — anything else.
 */
export type ApiErrorKind = 'api' | 'network' | 'timeout' | 'offline' | 'unknown';

/**
 * Error object produced by the error interceptor.
 *
 * @remarks
 * Extends native Error with HTTP status code, parsed error body, error kind,
 * and a flag indicating whether retrying the request may succeed.
 */
export type HttpApiError = Error & {
  status: number;
  body: ApiErrorBody | null;
  kind: ApiErrorKind;
  retryable: boolean;
};
