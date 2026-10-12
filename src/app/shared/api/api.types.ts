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
 * Error object produced by the error interceptor.
 *
 * @remarks
 * Extends native Error with HTTP status code and parsed error body.
 */
export type HttpApiError = Error & {
  status: number;
  body: ApiErrorBody | null;
};
