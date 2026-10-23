/**
 * Mock interceptor for the user API.
 *
 * @remarks
 * Intercepts HTTP requests to the user API and returns data from
 * `UserPersistence` (localStorage) instead of hitting a real backend.
 *
 * Active when `environment.useUsersApiMock` is `true`.
 *
 * Supported requests:
 * - GET /users/me — fetch user profile
 * - PUT /users/me — update user profile
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useUsersApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { defer } from 'rxjs';
import { map } from 'rxjs';

import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';
import { UserCatalogMockHandler } from './user-catalog.mock.handler';

import type { User } from '../../model';
import type { UpdateUserPayload } from '../../repository/user.port';

/**
 * HTTP interceptor that mocks user API responses for development.
 *
 * @remarks
 * Handles GET and PUT requests for the user profile endpoint.
 * Delegates to `UserCatalogMockHandler` for data operations.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const userApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(UserCatalogMockHandler);

  // GET /users/me — получение профиля пользователя
  if (req.method === 'GET' && req.url.endsWith(buildApiUrl('/users/me'))) {
    return defer(() => Promise.resolve(handler.getMe())).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // PUT /users/me — обновление профиля пользователя
  if (req.method === 'PUT' && req.url.endsWith(buildApiUrl('/users/me'))) {
    const payload = req.body as UpdateUserPayload;

    return defer(() => Promise.resolve(handler.getMe())).pipe(
      map((currentUser: User | null) => {
        if (!currentUser) {
          throw new Error('Пользователь не найден');
        }
        const updated: User = {
          ...currentUser,
          ...(payload.displayName !== undefined && { displayName: payload.displayName }),
          ...(payload.preferences !== undefined && {
            preferences: { ...currentUser.preferences, ...payload.preferences },
          }),
        };
        return updated;
      }),
      map((updated) => handler.updateMe(updated)),
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // Пропускаем запрос дальше
  return next(req);
};
