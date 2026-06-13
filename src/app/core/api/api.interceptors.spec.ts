import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_TOKEN_STORAGE_KEY, authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { isHttpApiError } from './api-error.utils';

describe('api interceptors', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

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
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should attach auth header for api requests when token exists', () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'test-token');

    http.get('/api/scenarios/demo').subscribe();

    const request = httpMock.expectOne('/api/scenarios/demo');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ data: [] });
  });

  it('should skip auth header for fixture requests', () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'test-token');

    http.get('/data/select-cards.json').subscribe();

    const request = httpMock.expectOne('/data/select-cards.json');
    expect(request.request.headers.has('Authorization')).toBeFalse();
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

    expect(isHttpApiError(caught)).toBeTrue();
    if (isHttpApiError(caught)) {
      expect(caught.status).toBe(404);
      expect(caught.message).toBe('Не найдено');
    }
  });
});
