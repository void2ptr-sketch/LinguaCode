import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { isHttpApiError } from '../../../shared/api/api-error.utils';
import { AuthTokenStorage } from '../../../entities/auth/services/auth-token.storage';

describe('api interceptors', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: AuthTokenStorage;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(AuthTokenStorage);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should attach auth header for api requests when token exists', () => {
    tokenStorage.write({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 60_000,
    });

    http.get('/api/scenarios/demo').subscribe();

    const request = httpMock.expectOne('/api/scenarios/demo');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ data: [] });
  });

  it('should not attach auth header for api requests when token is missing', () => {
    http.get('/api/scenarios/demo').subscribe();

    const request = httpMock.expectOne('/api/scenarios/demo');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ data: [] });
  });

  it('should skip auth header for fixture requests', () => {
    tokenStorage.write({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 60_000,
    });

    http.get('/repositories/select-cards.json').subscribe();

    const request = httpMock.expectOne('/repositories/select-cards.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('should normalize api errors', () => {
    let caught: unknown;

    http.get('/api/scenarios/missing').subscribe({
      error: (error) => {
        caught = error;
      },
    });

    const request = httpMock.expectOne('/api/scenarios/missing');
    request.flush({ message: 'Не найдено' }, { status: 404, statusText: 'Not Found' });

    expect(isHttpApiError(caught)).toBe(true);
    if (isHttpApiError(caught)) {
      expect(caught.status).toBe(404);
      expect(caught.message).toBe('Не найдено');
    }
  });
});
