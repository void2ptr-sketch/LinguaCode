/**
 * JWT payload decoding and claim extraction helpers.
 *
 * @remarks
 * Real backend access tokens are standard JWTs with a base64url-encoded
 * payload. `atob()` only accepts regular base64, so `-` / `_` characters and
 * missing padding must be normalised before decoding — otherwise the payload
 * silently fails to parse and the session loses its roles (the UI then marks
 * every entity as read-only).
 */

/** Decoded JWT payload (claims). */
export type JwtPayload = Record<string, unknown>;

/**
 * Decodes the payload segment of a JWT.
 *
 * @param token - JWT string (`header.payload.signature`).
 * @returns Parsed claims object, or `null` when the token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    // base64url → base64 (replace - with +, _ with /, pad with =)
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const parsed: unknown = JSON.parse(atob(base64));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

/** Converts a claim value to a list of role codes. */
function readRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') {
        return [item];
      }
      if (item && typeof item === 'object') {
        const authority = (item as Record<string, unknown>)['authority'];
        if (typeof authority === 'string') {
          return [authority];
        }
      }
      return [];
    });
  }

  if (typeof value === 'string') {
    return value.split(/[\s,]+/).filter(Boolean);
  }

  return [];
}

/**
 * Extracts role codes from JWT claims.
 *
 * @remarks
 * Different backends use different claim names (`roles`, `authorities`,
 * `role`, `scope`). Spring Security commonly emits `authorities` as an array
 * of `{ authority: 'ROLE_ADMIN' }` objects. Plain values (`ADMIN`, `USER`)
 * are normalised to `ROLE_*` codes.
 *
 * @param payload - Decoded JWT claims.
 * @returns Unique role codes (e.g. `['ROLE_ADMIN']`).
 */
export function extractJwtRoles(payload: JwtPayload | null): string[] {
  if (!payload) {
    return [];
  }

  const roles = new Set<string>();
  for (const claim of ['roles', 'authorities', 'role', 'scope', 'scopes']) {
    for (const rawRole of readRoles(payload[claim])) {
      const role = rawRole.trim();
      if (!role) {
        continue;
      }
      if (role.startsWith('ROLE_')) {
        roles.add(role);
      } else if (role === 'ADMIN' || role === 'AUTHOR' || role === 'USER') {
        roles.add(`ROLE_${role}`);
      }
    }
  }

  return [...roles];
}

/**
 * Extracts the user ID from JWT claims.
 *
 * @param payload - Decoded JWT claims.
 * @returns The user ID as a string, or `null` when no supported claim exists.
 */
export function extractJwtUserId(payload: JwtPayload | null): string | null {
  if (!payload) {
    return null;
  }

  for (const claim of ['userId', 'user_id', 'id', 'sub']) {
    const value = payload[claim];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}
