/**
 * Mock interceptor for the learning API.
 *
 * @remarks
 * Intercepts HTTP requests to the learning API and returns data from
 * `LearningResultsPersistence` (localStorage) instead of hitting a real backend.
 *
 * Active when `environment.useLearningApiMock` is `true`.
 *
 * Supported requests:
 * - POST /learning/results — record a learning result
 * - GET /learning/results/:userId — fetch learning results for a user
 * - GET /learning/accuracy/:userId/:cardId — fetch accuracy for a card
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useLearningApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { defer } from 'rxjs';
import { map } from 'rxjs';

import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';
import { LearningCatalogMockHandler } from './learning-catalog.mock.handler';

import type { LearningResult } from '../../model';

/**
 * Extracts the userId and cardId from a learning accuracy URL.
 *
 * @param url - The request URL.
 * @returns The userId and cardId, or `null` if the URL does not target card accuracy.
 */
const extractAccuracyParams = (url: string): { userId: string; cardId: string } | null => {
  const marker = `${buildApiUrl('/learning/accuracy/')}`;
  if (!url.includes(marker)) {
    return null;
  }

  const rest = url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0];
  const parts = rest.split('/');
  if (parts.length < 2) {
    return null;
  }

  return { userId: parts[0], cardId: parts[1] };
};

/**
 * Extracts the userId from a learning results URL.
 *
 * @param url - The request URL.
 * @returns The userId, or `null` if the URL does not target user results.
 */
const extractResultsUserId = (url: string): string | null => {
  const marker = `${buildApiUrl('/learning/results/')}`;
  if (!url.includes(marker)) {
    return null;
  }

  const rest = url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0];
  return rest || null;
};

/**
 * HTTP interceptor that mocks learning API responses for development.
 *
 * @remarks
 * Handles POST (record), GET (findByUser, getCardAccuracy) requests for the
 * learning endpoint. Delegates to `LearningCatalogMockHandler` for data operations.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const learningApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(LearningCatalogMockHandler);

  // POST /learning/results — запись результата обучения
  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/learning/results'))) {
    const body = req.body as Omit<LearningResult, 'id' | 'userId'>;

    return defer(() => Promise.resolve(handler.record(body))).pipe(
      map((data) => new HttpResponse({ status: 201, body: { data } })),
    );
  }

  const accuracyParams = extractAccuracyParams(req.url);
  if (req.method === 'GET' && accuracyParams) {
    return defer(() =>
      Promise.resolve(handler.getCardAccuracy(accuracyParams.userId, accuracyParams.cardId)),
    ).pipe(map((data) => new HttpResponse({ status: 200, body: { data } })));
  }

  const resultsUserId = extractResultsUserId(req.url);
  if (req.method === 'GET' && resultsUserId) {
    const params = new URLSearchParams(req.url.split('?')[1] ?? '');
    const page = parseInt(params.get('page') ?? '0', 10);
    const pageSize = parseInt(params.get('size') ?? '20', 10);

    return defer(() => Promise.resolve(handler.findByUser(resultsUserId, page, pageSize))).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // Пропускаем запрос дальше
  return next(req);
};
