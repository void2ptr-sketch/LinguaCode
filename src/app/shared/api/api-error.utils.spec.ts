import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import {
  parseApiErrorBody,
  toHttpApiError,
  createTimeoutApiError,
  createOfflineApiError,
  getApiErrorMessage,
  isHttpApiError,
  isRetryableError,
  isNetworkError,
  isTimeoutError,
  isOfflineError,
} from './api-error.utils';
import type { HttpApiError } from './api.types';

describe('parseApiErrorBody', () => {
  it('should parse string error body', () => {
    const error = new HttpErrorResponse({
      error: 'Server error',
      status: 500,
    });
    const result = parseApiErrorBody(error);
    expect(result).toEqual({ message: 'Server error' });
  });

  it('should ignore empty string body', () => {
    const error = new HttpErrorResponse({ error: '', status: 500 });
    expect(parseApiErrorBody(error)).toBeNull();
  });

  it('should parse object body with message', () => {
    const error = new HttpErrorResponse({
      error: { message: 'Validation failed', code: 'VALIDATION' },
      status: 400,
    });
    const result = parseApiErrorBody(error);
    expect(result).toEqual({ message: 'Validation failed', code: 'VALIDATION' });
  });

  it('should ignore object body without message', () => {
    const error = new HttpErrorResponse({
      error: { code: 'ERROR' },
      status: 500,
    });
    expect(parseApiErrorBody(error)).toBeNull();
  });

  it('should ignore object body with empty message', () => {
    const error = new HttpErrorResponse({
      error: { message: '' },
      status: 500,
    });
    expect(parseApiErrorBody(error)).toBeNull();
  });

  it('should ignore object body with non-string message', () => {
    const error = new HttpErrorResponse({
      error: { message: 123 },
      status: 500,
    });
    expect(parseApiErrorBody(error)).toBeNull();
  });
});

describe('toHttpApiError', () => {
  it('should return HttpApiError as-is', () => {
    const existing = Object.assign(new Error('existing'), {
      status: 500,
      body: { message: 'err' },
      kind: 'api',
      retryable: true,
    }) as HttpApiError;

    const result = toHttpApiError(existing);
    expect(result).toBe(existing);
  });

  it('should classify network error from ProgressEvent', () => {
    const error = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
    });
    const result = toHttpApiError(error);
    expect(result.kind).toBe('network');
    expect(result.retryable).toBe(true);
    expect(result.status).toBe(0);
  });

  it('should classify 5xx as retryable API error', () => {
    const error = new HttpErrorResponse({
      error: { message: 'Server error' },
      status: 500,
    });
    const result = toHttpApiError(error);
    expect(result.kind).toBe('api');
    expect(result.retryable).toBe(true);
    expect(result.status).toBe(500);
  });

  it('should classify 4xx as non-retryable API error', () => {
    const error = new HttpErrorResponse({
      error: { message: 'Not found' },
      status: 404,
    });
    const result = toHttpApiError(error);
    expect(result.kind).toBe('api');
    expect(result.retryable).toBe(false);
    expect(result.status).toBe(404);
  });

  it('should classify Error with TimeoutError name', () => {
    const error = Object.assign(new Error('test'), { name: 'TimeoutError' });
    const result = toHttpApiError(error);
    expect(result.kind).toBe('timeout');
    expect(result.retryable).toBe(true);
  });

  it('should classify Error with timeout in message', () => {
    const error = new Error('Request timeout occurred');
    const result = toHttpApiError(error);
    expect(result.kind).toBe('timeout');
    expect(result.retryable).toBe(true);
  });

  it('should classify plain Error as unknown', () => {
    const error = new Error('Something went wrong');
    const result = toHttpApiError(error);
    expect(result.kind).toBe('unknown');
    expect(result.retryable).toBe(false);
    expect(result.message).toBe('Something went wrong');
  });

  it('should classify non-Error values as unknown', () => {
    const result = toHttpApiError('string error');
    expect(result.kind).toBe('unknown');
    expect(result.retryable).toBe(false);
  });

  it('should classify null as unknown', () => {
    const result = toHttpApiError(null);
    expect(result.kind).toBe('unknown');
  });

  it('should classify undefined as unknown', () => {
    const result = toHttpApiError(undefined);
    expect(result.kind).toBe('unknown');
  });

  it('should handle HttpErrorResponse without error property', () => {
    const error = new HttpErrorResponse({ status: 500 });
    const result = toHttpApiError(error);
    expect(result.kind).toBe('api');
    expect(result.retryable).toBe(true);
  });
});

describe('createTimeoutApiError', () => {
  it('should create timeout error', () => {
    const result = createTimeoutApiError();
    expect(result.kind).toBe('timeout');
    expect(result.retryable).toBe(true);
    expect(result.status).toBe(0);
  });
});

describe('createOfflineApiError', () => {
  it('should create offline error', () => {
    const result = createOfflineApiError();
    expect(result.kind).toBe('offline');
    expect(result.retryable).toBe(false);
    expect(result.status).toBe(0);
  });
});

describe('getApiErrorMessage', () => {
  it('should return message from HttpApiError', () => {
    const apiError = Object.assign(new Error('Custom message'), {
      status: 500,
      body: { message: 'err' },
      kind: 'api',
      retryable: true,
    }) as HttpApiError;
    expect(getApiErrorMessage(apiError)).toBe('Custom message');
  });

  it('should return fallback for null status and no body', () => {
    const apiError = Object.assign(new Error(''), {
      status: 0,
      body: null,
      kind: 'unknown',
      retryable: false,
    }) as HttpApiError;
    expect(getApiErrorMessage(apiError, 'Fallback')).toBe('Fallback');
  });

  it('should return fallback for non-Error with null body', () => {
    expect(getApiErrorMessage('string error', 'Fallback')).toBe('Fallback');
  });

  it('should return message from Error', () => {
    const error = new Error('Error message');
    expect(getApiErrorMessage(error)).toBe('Error message');
  });
});

describe('isHttpApiError', () => {
  it('should return true for HttpApiError', () => {
    const apiError = Object.assign(new Error('test'), {
      status: 500,
      kind: 'api',
      retryable: true,
    }) as HttpApiError;
    expect(isHttpApiError(apiError)).toBe(true);
  });

  it('should return false for plain Error', () => {
    expect(isHttpApiError(new Error('test'))).toBe(false);
  });

  it('should return false for non-Error', () => {
    expect(isHttpApiError('string')).toBe(false);
    expect(isHttpApiError(null)).toBe(false);
    expect(isHttpApiError(undefined)).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('should return true for 5xx error', () => {
    const error = new HttpErrorResponse({ status: 500 });
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for 4xx error', () => {
    const error = new HttpErrorResponse({ status: 404 });
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return true for timeout error', () => {
    const error = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for unknown error', () => {
    expect(isRetryableError(new Error('unknown'))).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('should return true for ProgressEvent error', () => {
    const error = new HttpErrorResponse({ error: new ProgressEvent('error'), status: 0 });
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for API error', () => {
    const error = new HttpErrorResponse({ status: 500 });
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isTimeoutError', () => {
  it('should return true for timeout error', () => {
    const error = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    expect(isTimeoutError(error)).toBe(true);
  });

  it('should return false for network error', () => {
    const error = new HttpErrorResponse({ error: new ProgressEvent('error'), status: 0 });
    expect(isTimeoutError(error)).toBe(false);
  });
});

describe('isOfflineError', () => {
  it('should return true for offline error', () => {
    const offlineError = createOfflineApiError();
    expect(isOfflineError(offlineError)).toBe(true);
  });

  it('should return false for network error', () => {
    const error = new HttpErrorResponse({ error: new ProgressEvent('error'), status: 0 });
    expect(isOfflineError(error)).toBe(false);
  });
});
