import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { AuthApiService } from '../api/auth-api.service';
import { AuthTokenStorage } from './auth-token.storage';
import { AuthStore } from './auth.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { AuthSession, AuthTokens } from '../model/auth.types';

describe('AuthStore', () => {
  let store: AuthStore;
  let tokenStorage: AuthTokenStorage;

  const mockAuthApi = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };

  const tokens: AuthTokens = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() + 3_600_000,
  };

  const session: AuthSession = {
    user: { id: 'u1', displayName: 'User', email: 'user@example.com' },
    tokens,
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        AuthTokenStorage,
        { provide: AuthApiService, useValue: mockAuthApi },
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    });

    store = TestBed.inject(AuthStore);
    tokenStorage = TestBed.inject(AuthTokenStorage);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should start anonymous', () => {
    expect(store.status()).toBe('anonymous');
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.accessToken()).toBeNull();
  });

  it('should login and persist tokens', async () => {
    mockAuthApi.login.mockResolvedValue(session);

    const ok = await store.login({ email: 'user@example.com', password: 'secret' });

    expect(ok).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.displayName).toBe('User');
    expect(store.accessToken()).toBe('access-1');
    expect(tokenStorage.read()).toEqual(tokens);
  });

  it('should set error and stay anonymous on failed login', async () => {
    mockAuthApi.login.mockRejectedValue(new Error('bad credentials'));

    const ok = await store.login({ email: 'user@example.com', password: 'wrong' });

    expect(ok).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.error()).toBeTruthy();
  });

  it('should restore a valid session from storage', async () => {
    tokenStorage.write(tokens);

    await store.restoreSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.accessToken()).toBe('access-1');
  });

  it('should refresh an expired session on restore', async () => {
    tokenStorage.write({ ...tokens, expiresAt: Date.now() - 1_000 });
    mockAuthApi.refresh.mockResolvedValue({ ...tokens, accessToken: 'access-2' });

    await store.restoreSession();

    expect(mockAuthApi.refresh).toHaveBeenCalledWith('refresh-1');
    expect(store.accessToken()).toBe('access-2');
    expect(store.isAuthenticated()).toBe(true);
  });

  it('should clear session when refresh fails', async () => {
    tokenStorage.write({ ...tokens, expiresAt: Date.now() - 1_000 });
    mockAuthApi.refresh.mockRejectedValue(new Error('refresh failed'));

    await store.restoreSession();

    expect(store.isAuthenticated()).toBe(false);
    expect(tokenStorage.read()).toBeNull();
  });

  it('should logout and clear session', async () => {
    tokenStorage.write(tokens);
    mockAuthApi.logout.mockResolvedValue(undefined);

    await store.logout();

    expect(mockAuthApi.logout).toHaveBeenCalled();
    expect(store.isAuthenticated()).toBe(false);
    expect(tokenStorage.read()).toBeNull();
  });

  it('should deduplicate concurrent refresh calls', async () => {
    tokenStorage.write({ ...tokens, expiresAt: Date.now() - 1_000 });
    mockAuthApi.refresh.mockResolvedValue({ ...tokens, accessToken: 'access-2' });

    const [r1, r2] = await Promise.all([store.refreshSession(), store.refreshSession()]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(mockAuthApi.refresh).toHaveBeenCalledTimes(1);
  });
});
