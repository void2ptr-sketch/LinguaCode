import { describe, expect, it } from 'vitest';
import { retryInterceptor } from './retry.interceptor';
import { isRetryableError } from '../../../shared/api/api-error.utils';
import { isApiRequest } from '../../../shared/api/api-url';

describe('retryInterceptor', () => {
  it('should be defined', () => {
    expect(retryInterceptor).toBeDefined();
    expect(typeof retryInterceptor).toBe('function');
  });

  it('should handle retryable errors', () => {
    expect(isRetryableError).toBeDefined();
  });

  it('should recognize API requests', () => {
    expect(isApiRequest('/api/v1/cards')).toBe(true);
    expect(isApiRequest('/api/v1/scenarios')).toBe(true);
  });

  it('should not recognize non-API URLs', () => {
    expect(isApiRequest('/assets/data.json')).toBe(false);
    expect(isApiRequest('https://example.com/api')).toBe(false);
  });
});
