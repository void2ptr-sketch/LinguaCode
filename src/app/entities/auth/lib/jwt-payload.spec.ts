import { decodeJwtPayload, extractJwtRoles, extractJwtUserId } from './jwt-payload';

/** Builds a JWT-shaped token with a base64url-encoded payload. */
function makeToken(payload: Record<string, unknown>): string {
  const base64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64}.signature`;
}

describe('jwt-payload', () => {
  describe('decodeJwtPayload', () => {
    it('decodes a base64url payload', () => {
      const payload = { sub: 'user-1', exp: 9999999999 };
      expect(decodeJwtPayload(makeToken(payload))).toEqual(payload);
    });

    it('decodes payloads containing base64url-only characters', () => {
      // JSON is chosen so that the regular base64 form contains `+` or `/`,
      // which must be normalised before `atob()`.
      const payload = { data: '\u00ff\u00ff' };
      const token = makeToken(payload);
      expect(decodeJwtPayload(token)).toEqual(payload);
    });

    it('returns null for malformed tokens', () => {
      expect(decodeJwtPayload('no-dots')).toBeNull();
      expect(decodeJwtPayload('header.!!!.signature')).toBeNull();
    });
  });

  describe('extractJwtRoles', () => {
    it('reads the roles claim', () => {
      expect(extractJwtRoles({ roles: ['ROLE_ADMIN'] })).toEqual(['ROLE_ADMIN']);
    });

    it('reads Spring Security authorities objects', () => {
      expect(
        extractJwtRoles({
          authorities: [{ authority: 'ROLE_AUTHOR' }, { authority: 'ROLE_USER' }],
        }),
      ).toEqual(['ROLE_AUTHOR', 'ROLE_USER']);
    });

    it('reads space-separated scope claim and normalises plain roles', () => {
      expect(extractJwtRoles({ scope: 'ADMIN USER' })).toEqual(['ROLE_ADMIN', 'ROLE_USER']);
    });

    it('deduplicates roles across claims', () => {
      expect(
        extractJwtRoles({ roles: ['ROLE_ADMIN'], authorities: [{ authority: 'ROLE_ADMIN' }] }),
      ).toEqual(['ROLE_ADMIN']);
    });

    it('returns an empty list for missing payloads', () => {
      expect(extractJwtRoles(null)).toEqual([]);
    });
  });

  describe('extractJwtUserId', () => {
    it('prefers userId over sub', () => {
      expect(extractJwtUserId({ userId: 42, sub: 'fallback' })).toBe('42');
    });

    it('falls back to sub', () => {
      expect(extractJwtUserId({ sub: 'user-1' })).toBe('user-1');
    });

    it('returns null when no supported claim exists', () => {
      expect(extractJwtUserId({})).toBeNull();
    });
  });
});
