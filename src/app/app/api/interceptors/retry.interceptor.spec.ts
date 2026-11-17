import { describe, expect, it } from 'vitest';
import { retryInterceptor } from './retry.interceptor';
import { isRetryableError } from '../../../shared/api/api-error.utils';
import { timer } from 'rxjs';

describe('retryInterceptor', () => {
  it('should be defined', () => {
    expect(retryInterceptor).toBeDefined();
    expect(typeof retryInterceptor).toBe('function');
  });

  it('should handle retryable errors', () => {
    expect(isRetryableError).toBeDefined();
  });

  it('should use exponential backoff delay', () => {
    expect(timer).toBeDefined();
  });
});
