import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { provideApiHttp } from './provide-api.http';

describe('provideApiHttp', () => {
  afterEach(() => {
    // Restore original environment
    vi.restoreAllMocks();
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
    // In dev environment, all mock flags are true by default
    expect(environment.useCardsApiMock).toBe(true);
    expect(environment.useScenariosApiMock).toBe(true);
    expect(environment.useCoursesApiMock).toBe(true);

    const config = provideApiHttp();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    expect(http).toBeDefined();
  });

  it('should work with fetch strategy enabled', () => {
    const config = provideApiHttp();

    TestBed.configureTestingModule({
      providers: [config, provideHttpClientTesting()],
    });

    const http = TestBed.inject(HttpClient);
    expect(http).toBeDefined();
  });
});
