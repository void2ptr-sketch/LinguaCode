import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildApiUrl } from '../../../shared/api/api-url';
import { AuthApiService } from './auth-api.service';
import type { AuthSession, AuthTokens } from '../model/auth.types';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthApiService],
    });

    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should login and return the session', async () => {
    const session: AuthSession = {
      user: { id: 'u1', displayName: 'User', email: 'user@example.com' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresAt: 1_700_000_000_000 },
    };

    const promise = service.login({ email: 'user@example.com', password: 'secret' });

    const req = httpMock.expectOne(buildApiUrl('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com', password: 'secret' });
    req.flush({ data: session });

    await expect(promise).resolves.toEqual(session);
  });

  it('should refresh tokens', async () => {
    const tokens: AuthTokens = {
      accessToken: 'a2',
      refreshToken: 'r2',
      expiresAt: 1_700_000_000_000,
    };

    const promise = service.refresh('r1');

    const req = httpMock.expectOne(buildApiUrl('/auth/refresh'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'r1' });
    req.flush({ data: tokens });

    await expect(promise).resolves.toEqual(tokens);
  });

  it('should logout', async () => {
    const promise = service.logout();

    const req = httpMock.expectOne(buildApiUrl('/auth/logout'));
    expect(req.request.method).toBe('POST');
    req.flush({ data: null });

    await expect(promise).resolves.toBeUndefined();
  });
});
