import { initialAuthState, isAccessTokenExpired } from './auth-state';
import type { AuthTokens } from './auth.types';

// Helper: create a fake JWT with a specific exp claim (seconds since epoch).
// Payload is base64url-encoded: {"sub":"u1","exp":<seconds>}
function makeJwt(expSeconds: number): string {
  const payload = JSON.stringify({ sub: 'u1', exp: expSeconds });
  // base64url encode
  const b64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${b64}.signature`;
}

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
    it('should return true when JWT exp is in the past', () => {
      const tokens: AuthTokens = {
        accessToken: makeJwt(1_000),
        refreshToken: 'refresh',
      };
      expect(isAccessTokenExpired(tokens, 2_000_000)).toBe(true);
    });

    it('should return false when JWT exp is in the future', () => {
      const tokens: AuthTokens = {
        accessToken: makeJwt(999_999_999_999),
        refreshToken: 'refresh',
      };
      expect(isAccessTokenExpired(tokens, 1_000_000_000_000)).toBe(false);
    });

    it('should treat exact expiry as expired', () => {
      const expSeconds = 1_000;
      const tokens: AuthTokens = {
        accessToken: makeJwt(expSeconds),
        refreshToken: 'refresh',
      };
      // now in ms equals exp in seconds (converted to ms)
      expect(isAccessTokenExpired(tokens, expSeconds * 1000)).toBe(true);
    });

    it('should treat invalid JWT as expired (safe fallback)', () => {
      const tokens: AuthTokens = {
        accessToken: 'not-a-jwt',
        refreshToken: 'refresh',
      };
      expect(isAccessTokenExpired(tokens, Date.now())).toBe(true);
    });
  });
});
