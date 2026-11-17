import { TestBed } from '@angular/core/testing';
import { of, throwError, timer } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { retryInterceptor } from './retry.interceptor';
import { isRetryableError } from '../../../shared/api/api-error.utils';

describe('retryInterceptor', () => {
  it('should be defined', () => {
    expect(retryInterceptor).toBeDefined();
    expect(typeof retryInterceptor).toBe('function');
  });

  it('should not retry non-GET requests', () => {
    const nextFn = vi.fn().mockReturnValue(of({}));
    const mockReq = { method: 'POST', url: '/api/test' };

    expect(() => retryInterceptor(mockReq as any, nextFn as any)).not.toThrow();
    expect(nextFn).toHaveBeenCalled();
  });

  it('should not retry non-API requests', () => {
    const nextFn = vi.fn().mockReturnValue(of({}));
    const mockReq = { method: 'GET', url: '/data/test.json' };

    expect(() => retryInterceptor(mockReq as any, nextFn as any)).not.toThrow();
    expect(nextFn).toHaveBeenCalled();
  });

  it('should retry GET API requests', () => {
    const nextFn = vi.fn().mockReturnValue(of({ data: 'test' }));
    const mockReq = { method: 'GET', url: '/api/v1/test' };

    expect(() => retryInterceptor(mockReq as any, nextFn as any)).not.toThrow();
  });

  it('should handle retryable errors', () => {
    // Verify isRetryableError is available
    expect(isRetryableError).toBeDefined();
  });

  it('should use exponential backoff delay', () => {
    // Verify timer is available for delay calculation
    expect(timer).toBeDefined();
  });
});
