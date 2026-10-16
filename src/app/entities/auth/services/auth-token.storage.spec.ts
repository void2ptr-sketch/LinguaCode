import { AUTH_TOKEN_STORAGE_KEY, AuthTokenStorage } from './auth-token.storage';
import type { AuthTokens } from '../model/auth.types';

describe('AuthTokenStorage', () => {
  let storage: AuthTokenStorage;

  const tokens: AuthTokens = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: 1_700_000_000_000,
  };

  beforeEach(() => {
    sessionStorage.clear();
    storage = new AuthTokenStorage();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should return null when nothing is stored', () => {
    expect(storage.read()).toBeNull();
    expect(storage.readAccessToken()).toBeNull();
  });

  it('should write and read tokens', () => {
    storage.write(tokens);

    expect(storage.read()).toEqual(tokens);
    expect(storage.readAccessToken()).toBe('access-1');
  });

  it('should return null for corrupted payload', () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'not-json');

    expect(storage.read()).toBeNull();
    expect(storage.readAccessToken()).toBeNull();
  });

  it('should clear tokens', () => {
    storage.write(tokens);
    storage.clear();

    expect(storage.read()).toBeNull();
  });
});
