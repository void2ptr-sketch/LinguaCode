import { extractJwtExpMs } from './jwt-exp';

describe('extractJwtExpMs', () => {
  it('should extract exp from a valid JWT', () => {
    const payload = JSON.stringify({ sub: 'u1', exp: 1_700_000_000 });
    const b64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `header.${b64}.signature`;

    expect(extractJwtExpMs(token)).toBe(1_700_000_000_000); // seconds → ms
  });

  it('should return null for a malformed token (no dots)', () => {
    expect(extractJwtExpMs('no-dots-here')).toBeNull();
  });

  it('should return null for a token with invalid base64 payload', () => {
    expect(extractJwtExpMs('header.!!!.signature')).toBeNull();
  });

  it('should return null for a token with non-JSON payload', () => {
    const b64 = btoa('not-json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(extractJwtExpMs(`header.${b64}.signature`)).toBeNull();
  });

  it('should return null when payload has no exp claim', () => {
    const payload = JSON.stringify({ sub: 'u1' });
    const b64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(extractJwtExpMs(`header.${b64}.signature`)).toBeNull();
  });
});
