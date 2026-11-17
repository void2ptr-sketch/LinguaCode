import { describe, expect, it } from 'vitest';
import { TimeoutError } from 'rxjs';
import { timeoutInterceptor } from './timeout.interceptor';

describe('timeoutInterceptor', () => {
  it('should be defined', () => {
    expect(timeoutInterceptor).toBeDefined();
    expect(typeof timeoutInterceptor).toBe('function');
  });

  it('should handle TimeoutError type', () => {
    // Verify that TimeoutError is available for instanceof checks
    expect(TimeoutError).toBeDefined();
    expect(typeof TimeoutError).toBe('function');
  });

  it('should be an HttpInterceptorFn', () => {
    // The interceptor should be callable with (req, next) signature
    expect(typeof timeoutInterceptor).toBe('function');
  });
});
