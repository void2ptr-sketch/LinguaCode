import { initialAuthState, isAccessTokenExpired } from './auth-state';
import type { AuthTokens } from './auth.types';

describe('auth-state', () => {
  describe('initialAuthState', () => {
    it('should start anonymous without user, tokens or error', () => {
      expect(initialAuthState.status).toBe('anonymous');
      expect(initialAuthState.user).toBeNull();
      expect(initialAuthState.tokens).toBeNull();
      expect(initialAuthState.error).toBeNull();
    });
  });

  describe('isAccessTokenExpired', () => {
    const tokens: AuthTokens = {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 1_000,
    };

    it('should return true when expiresAt is in the past', () => {
      expect(isAccessTokenExpired(tokens, 2_000)).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      expect(isAccessTokenExpired(tokens, 500)).toBe(false);
    });

    it('should treat exact expiry as expired', () => {
      expect(isAccessTokenExpired(tokens, 1_000)).toBe(true);
    });
  });
});
