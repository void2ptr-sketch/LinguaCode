import { decodeJwtPayload } from './jwt-payload';

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
  const claims = decodeJwtPayload(token);
  if (typeof claims?.['exp'] === 'number') {
    return (claims['exp'] as number) * 1000; // seconds → milliseconds
  }
  return null;
}
