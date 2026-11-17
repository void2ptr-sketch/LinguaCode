import { TestBed, inject } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { offlineInterceptor } from './offline.interceptor';
import { NetworkStatusService } from '../../../shared/api/network-status.service';

describe('offlineInterceptor', () => {
  it('should be defined', () => {
    expect(offlineInterceptor).toBeDefined();
    expect(typeof offlineInterceptor).toBe('function');
  });

  it('should call networkStatus.online when processing API request', async () => {
    const onlineSpy = vi.fn(() => true);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NetworkStatusService,
          useValue: { online: onlineSpy },
        },
      ],
    });

    const injector = TestBed.inject(Injector);
    const mockReq = { url: '/api/test' };
    const mockNext = vi.fn().mockReturnValue(of({}));

    await runInInjectionContext(injector, () => {
      expect(() => offlineInterceptor(mockReq as any, mockNext as any)).not.toThrow();
      expect(onlineSpy).toHaveBeenCalled();
    });
  });

  it('should handle offline state', async () => {
    const onlineSpy = vi.fn(() => false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NetworkStatusService,
          useValue: { online: onlineSpy },
        },
      ],
    });

    const injector = TestBed.inject(Injector);
    const mockReq = { url: '/api/test' };
    const mockNext = vi.fn().mockReturnValue(of({}));

    await runInInjectionContext(injector, () => {
      expect(() => offlineInterceptor(mockReq as any, mockNext as any)).not.toThrow();
      expect(onlineSpy).toHaveBeenCalled();
    });
  });

  it('should pass through non-API requests without checking online status', async () => {
    const onlineSpy = vi.fn(() => false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NetworkStatusService,
          useValue: { online: onlineSpy },
        },
      ],
    });

    const injector = TestBed.inject(Injector);
    const mockReq = { url: '/data/test.json' };
    const mockNext = vi.fn().mockReturnValue(of({}));

    await runInInjectionContext(injector, () => {
      expect(() => offlineInterceptor(mockReq as any, mockNext as any)).not.toThrow();
      // For non-API requests, online() should NOT be called
      expect(onlineSpy).not.toHaveBeenCalled();
    });
  });
});
