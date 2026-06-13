import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, HttpApiError } from './api.types';

const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка при обращении к серверу';

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

export const toHttpApiError = (error: unknown): HttpApiError => {
  if (isHttpApiError(error)) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const body = parseApiErrorBody(error);
    const message = body?.message ?? error.message ?? DEFAULT_ERROR_MESSAGE;

    return Object.assign(new Error(message), {
      status: error.status,
      body,
    });
  }

  if (error instanceof Error) {
    return Object.assign(new Error(error.message), {
      status: 0,
      body: null,
    });
  }

  return Object.assign(new Error(DEFAULT_ERROR_MESSAGE), {
    status: 0,
    body: null,
  });
};

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
