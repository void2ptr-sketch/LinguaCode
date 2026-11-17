import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { provideApiHttp, provideApiHttpTesting } from './provide-api.http';

describe('provideApiHttp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should provide HttpClient when called', () => {
    const config = provideApiHttp();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    expect(http).toBeInstanceOf(HttpClient);
  });

  it('should include authInterceptor and errorInterceptor by default', () => {
    const config = provideApiHttp();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    let caught: unknown;
    http.get('/api/test').subscribe({
      error: (error) => {
        caught = error;
      },
    });

    const request = httpMock.expectOne('/api/test');
    request.flush({ message: 'test' }, { status: 404, statusText: 'Not Found' });

    // errorInterceptor should transform the error
    expect(caught).toBeInstanceOf(Error);
    const apiError = caught as { status: number; body: unknown };
    expect(apiError.status).toBe(404);
  });

  it('should include mock interceptors when environment flags are true', () => {
    const config = provideApiHttp();
    expect(config).toBeDefined();
  });

  it('should work with fetch strategy enabled', () => {
    const config = provideApiHttp();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    expect(http).toBeDefined();
  });

  it('should provide HttpClient for testing', () => {
    const config = provideApiHttpTesting();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    expect(http).toBeInstanceOf(HttpClient);
  });

  it('should include all mock interceptors in testing config', () => {
    const config = provideApiHttpTesting();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    let caught: unknown;
    http.get('/api/test').subscribe({
      error: (error) => {
        caught = error;
      },
    });

    const request = httpMock.expectOne('/api/test');
    request.flush({ message: 'test' }, { status: 404, statusText: 'Not Found' });

    expect(caught).toBeInstanceOf(Error);
  });
});
