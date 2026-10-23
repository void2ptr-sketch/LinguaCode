/**
 * Извлекает `exp` (expiration time) из JWT-токена.
 *
 * @remarks
 * JWT-токен имеет структуру `header.payload.signature`.
 * Payload — base64url-кодированный JSON с полем `exp` (seconds since epoch).
 *
 * Возвращает Unix-время в миллисекундах или `null`, если токен невалиден.
 *
 * @param token — JWT-токен.
 * @returns Unix-время истечения в мс, или `null`.
 */
export function extractJwtExpMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1];
    // base64url → base64 (replace - with +, _ with /, pad with =)
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = atob(base64);
    const claims = JSON.parse(json) as { exp?: number };
    if (typeof claims.exp === 'number') {
      return claims.exp * 1000; // seconds → milliseconds
    }
    return null;
  } catch {
    return null;
  }
}
