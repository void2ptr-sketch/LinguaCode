/**
 * Mock interceptor for the auth API.
 *
 * @remarks
 * Intercepts `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/logout`
 * and returns canned token data instead of hitting a real backend.
 *
 * Active when `environment.useAuthApiMock` is `true`.
 *
 * Supported requests:
 * - POST /auth/login — accepts any email/password, returns a fake session
 * - POST /auth/refresh — returns a fresh token pair
 * - POST /auth/logout — always succeeds
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useAuthApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';

/** Fake JWT: header `{"alg":"HS256","typ":"JWT"}`, payload `{"sub":"mock-user","exp":9999999999}` */
const FAKE_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJtb2NrLXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.' +
  'mock-signature-for-development-only';

/** Fake refresh token for development. */
const FAKE_REFRESH_TOKEN = 'mock-refresh-token-dev-only';

/** Hardcoded email → display name map for a nicer UI after login. */
const MOCK_USERS: Record<string, string> = {
  'admin@linguacode.com': 'Administrator',
  'user@linguacode.com': 'Regular User',
};

/**
 * HTTP interceptor that mocks auth API responses for development.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const authApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  // POST /auth/login — accept any credentials, return fake session
  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/auth/login'))) {
    const body = req.body as Record<string, unknown>;
    const email = (body['email'] as string) ?? '';
    const displayName = MOCK_USERS[email] ?? email.split('@')[0];

    return of(
      new HttpResponse({
        status: 200,
        body: {
          data: {
            userId: 'mock-user-id',
            accessToken: FAKE_ACCESS_TOKEN,
            refreshToken: FAKE_REFRESH_TOKEN,
            displayName,
          },
        },
      }),
    );
  }

  // POST /auth/refresh — return fresh mock tokens
  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/auth/refresh'))) {
    return of(
      new HttpResponse({
        status: 200,
        body: {
          data: {
            accessToken: FAKE_ACCESS_TOKEN,
            refreshToken: FAKE_REFRESH_TOKEN,
          },
        },
      }),
    );
  }

  // POST /auth/logout — always succeed
  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/auth/logout'))) {
    return of(
      new HttpResponse({
        status: 200,
        body: { data: null },
      }),
    );
  }

  return next(req);
};
