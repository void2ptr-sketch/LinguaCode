import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../api.types';
import {
  getApiErrorMessage,
  isHttpApiError,
  parseApiErrorBody,
  toHttpApiError,
} from './api-error.utils';

describe('api-error.utils', () => {
  describe('parseApiErrorBody', () => {
    it('should return null for HttpErrorResponse with no error body', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: null,
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should return null for HttpErrorResponse with empty error body', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: '',
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should parse string error body into ApiErrorBody', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: 'Internal server error',
      });

      const result = parseApiErrorBody(httpError);

      expect(result).toEqual({ message: 'Internal server error' });
    });

    it('should return null for empty string body with whitespace', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: '   ',
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should parse object error body with message', () => {
      const body: ApiErrorBody = { message: 'Card not found', code: 'NOT_FOUND' };
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: body,
      });

      const result = parseApiErrorBody(httpError);

      expect(result).toEqual(body);
      expect(result?.code).toBe('NOT_FOUND');
    });

    it('should return null for object body without message property', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: { code: 'UNKNOWN' },
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should return null for object body with empty message', () => {
      const httpError = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: '' },
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should return null for object body with whitespace-only message', () => {
      const httpError = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: '   ' },
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should return null for object body with non-string message', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: { message: 123 },
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });

    it('should return null for empty object body', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: {},
      });

      expect(parseApiErrorBody(httpError)).toBeNull();
    });
  });

  describe('toHttpApiError', () => {
    it('should return existing HttpApiError as-is', () => {
      const existingError = Object.assign(new Error('existing'), {
        status: 500,
        body: { message: 'test' },
      });

      const result = toHttpApiError(existingError);

      expect(result).toBe(existingError);
      expect(isHttpApiError(result)).toBe(true);
    });

    it('should transform HttpErrorResponse with parsed body', () => {
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Resource not found' },
      });

      const apiError = toHttpApiError(httpError);

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(404);
      expect(apiError.message).toBe('Resource not found');
      expect(apiError.body).toEqual({ message: 'Resource not found' });
    });

    it('should use error.message when body has no valid message', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: { code: 'UNKNOWN' },
      });
      // HttpErrorResponse.message is set by Angular runtime
      Object.defineProperty(httpError, 'message', {
        value: 'Http failure during parsing',
        writable: true,
      });

      const apiError = toHttpApiError(httpError);

      expect(apiError.status).toBe(500);
      expect(apiError.message).toBe('Http failure during parsing');
      expect(apiError.body).toBeNull();
    });

    it('should use error.message when body has no valid message', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: {},
      });

      const apiError = toHttpApiError(httpError);

      expect(apiError.status).toBe(500);
      // HttpErrorResponse provides its own message
      expect(apiError.message).toBeDefined();
      expect(apiError.body).toBeNull();
    });

    it('should handle HttpErrorResponse with string error body', () => {
      const httpError = new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: 'Service temporarily unavailable',
      });

      const apiError = toHttpApiError(httpError);

      expect(apiError.status).toBe(503);
      expect(apiError.message).toBe('Service temporarily unavailable');
      expect(apiError.body).toEqual({ message: 'Service temporarily unavailable' });
    });

    it('should handle HttpErrorResponse with status 0', () => {
      const httpError = new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown',
        error: null,
      });

      const apiError = toHttpApiError(httpError);

      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
    });

    it('should transform plain Error with status 0 and null body', () => {
      const plainError = new Error('Network error');

      const apiError = toHttpApiError(plainError);

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
      expect(apiError.message).toBe('Network error');
    });

    it('should use default message for non-Error values', () => {
      const apiError = toHttpApiError('something went wrong');

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
      expect(apiError.message).toBe('Произошла ошибка при обращении к серверу');
    });

    it('should use default message for null', () => {
      const apiError = toHttpApiError(null);

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
      expect(apiError.message).toBe('Произошла ошибка при обращении к серверу');
    });

    it('should use default message for undefined', () => {
      const apiError = toHttpApiError(undefined);

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
      expect(apiError.message).toBe('Произошла ошибка при обращении к серверу');
    });

    it('should use default message for number', () => {
      const apiError = toHttpApiError(42);

      expect(isHttpApiError(apiError)).toBe(true);
      expect(apiError.status).toBe(0);
      expect(apiError.body).toBeNull();
      expect(apiError.message).toBe('Произошла ошибка при обращении к серверу');
    });
  });

  describe('getApiErrorMessage', () => {
    it('should return message from HttpApiError', () => {
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Not found' },
      });

      expect(getApiErrorMessage(httpError)).toBe('Not found');
    });

    it('should return fallback for unknown error types with status 0', () => {
      expect(getApiErrorMessage('error', 'Custom fallback')).toBe('Custom fallback');
    });

    it('should return fallback for null with custom fallback message', () => {
      expect(getApiErrorMessage(null, 'Load failed')).toBe('Load failed');
    });

    it('should return default fallback for unknown errors', () => {
      expect(getApiErrorMessage('bad')).toBe('Произошла ошибка при обращении к серверу');
    });

    it('should return message from plain Error', () => {
      const error = new Error('Something broke');
      expect(getApiErrorMessage(error)).toBe('Something broke');
    });

    it('should return fallback when HttpApiError has empty message', () => {
      const apiError = Object.assign(new Error(''), {
        status: 500,
        body: { message: 'test' },
      });

      // Empty message is falsy, so || returns fallback
      expect(getApiErrorMessage(apiError)).toBe('Произошла ошибка при обращении к серверу');
    });

    it('should return default message for non-Error with status 0 and null body', () => {
      expect(getApiErrorMessage('string error')).toBe(
        'Произошла ошибка при обращении к серверу',
      );
    });

    it('should use custom fallback when provided', () => {
      expect(getApiErrorMessage('unknown', 'Custom error')).toBe('Custom error');
    });
  });

  describe('isHttpApiError', () => {
    it('should return true for HttpApiError', () => {
      const apiError = Object.assign(new Error('test'), {
        status: 404,
        body: { message: 'not found' },
      });

      expect(isHttpApiError(apiError)).toBe(true);
    });

    it('should return false for plain Error without status', () => {
      expect(isHttpApiError(new Error('plain'))).toBe(false);
    });

    it('should return false for string', () => {
      expect(isHttpApiError('error')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHttpApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHttpApiError(undefined)).toBe(false);
    });

    it('should return false for number', () => {
      expect(isHttpApiError(42)).toBe(false);
    });

    it('should return false for object without status property', () => {
      expect(isHttpApiError({ message: 'test' })).toBe(false);
    });

    it('should return false when status is not a number', () => {
      const error = Object.assign(new Error('test'), { status: '500' });
      expect(isHttpApiError(error)).toBe(false);
    });

    it('should return true when status is 0 (number)', () => {
      const error = Object.assign(new Error('test'), { status: 0 });
      expect(isHttpApiError(error)).toBe(true);
    });

    it('should narrow type correctly', () => {
      const errorObject: unknown = Object.assign(new Error('test'), { status: 404 });
      if (isHttpApiError(errorObject)) {
        expect(errorObject.status).toBe(404);
        expect(typeof errorObject.status).toBe('number');
      }
    });
  });
});
