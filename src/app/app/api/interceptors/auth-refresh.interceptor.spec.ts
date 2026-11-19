import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthStore } from '../../../entities/auth/services/auth.store';
import { authRefreshInterceptor } from './auth-refresh.interceptor';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { isHttpApiError } from '../../../shared/api/api-error.utils';

/**
 * Drains pending microtasks deterministically.
 *
 * The interceptor chains `from(refreshSession())` into `switchMap`, so the retried
 * request is issued on a microtask. Yielding a few microtask turns is enough and,
 * unlike `setTimeout`, never depends on wall-clock timers (which can stall under
 * a loaded CI worker and time the test out).
 */
const flushMicrotasks = async (turns = 10): Promise<void> => {
  for (let i = 0; i < turns; i += 1) {
    await Promise.resolve();
  }
};

describe('authRefreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const createMockAuthStore = () => ({
    refreshSession: vi.fn().mockResolvedValue(false),
    accessToken: vi.fn().mockReturnValue(null),
  });

  let mockAuthStore: ReturnType<typeof createMockAuthStore>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    mockAuthStore = createMockAuthStore();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authRefreshInterceptor, authInterceptor, errorInterceptor]),
        ),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should refresh and retry the request with a fresh token after 401', async () => {
    mockAuthStore.refreshSession.mockResolvedValue(true);
    mockAuthStore.accessToken.mockReturnValue('fresh-token');

    const received: unknown[] = [];
    http.get('/api/scenarios/demo').subscribe((data) => received.push(data));

    const first = httpMock.expectOne('/api/scenarios/demo');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Let the refreshSession() promise resolve and the retry request be issued.
    await flushMicrotasks();

    const retried = httpMock.expectOne('/api/scenarios/demo');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retried.flush({ data: [] });

    expect(received).toEqual([{ data: [] }]);
    expect(mockAuthStore.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('should rethrow the original error when refresh fails', async () => {
    mockAuthStore.refreshSession.mockResolvedValue(false);

    let caught: unknown;
    http.get('/api/scenarios/demo').subscribe({ error: (e) => (caught = e) });

    const first = httpMock.expectOne('/api/scenarios/demo');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await flushMicrotasks();

    expect(isHttpApiError(caught)).toBe(true);
    if (isHttpApiError(caught)) {
      expect(caught.status).toBe(401);
    }
    expect(mockAuthStore.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('should not refresh for non-401 errors', () => {
    let caught: unknown;
    http.get('/api/scenarios/demo').subscribe({ error: (e) => (caught = e) });

    const request = httpMock.expectOne('/api/scenarios/demo');
    request.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(isHttpApiError(caught)).toBe(true);
    if (isHttpApiError(caught)) {
      expect(caught.status).toBe(500);
    }
    expect(mockAuthStore.refreshSession).not.toHaveBeenCalled();
  });

  it('should not refresh for auth endpoints', () => {
    let caught: unknown;
    http.post('/api/auth/login', { email: 'a@b.c', password: 'x' }).subscribe({
      error: (e) => (caught = e),
    });

    const request = httpMock.expectOne('/api/auth/login');
    request.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(isHttpApiError(caught)).toBe(true);
    expect(mockAuthStore.refreshSession).not.toHaveBeenCalled();
  });
});
