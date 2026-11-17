import { describe, expect, it } from 'vitest';
import { timeoutInterceptor } from './timeout.interceptor';

describe('timeoutInterceptor', () => {
  it('should be defined', () => {
    expect(timeoutInterceptor).toBeDefined();
    expect(typeof timeoutInterceptor).toBe('function');
  });

  it('should be an HttpInterceptorFn', () => {
    expect(typeof timeoutInterceptor).toBe('function');
  });
});
