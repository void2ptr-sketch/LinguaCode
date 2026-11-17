import { describe, expect, it } from 'vitest';
import { timeoutInterceptor } from './timeout.interceptor';
import { isApiRequest } from '../../../shared/api/api-url';

describe('timeoutInterceptor', () => {
  it('should be defined', () => {
    expect(timeoutInterceptor).toBeDefined();
    expect(typeof timeoutInterceptor).toBe('function');
  });

  it('should be an HttpInterceptorFn', () => {
    expect(typeof timeoutInterceptor).toBe('function');
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
