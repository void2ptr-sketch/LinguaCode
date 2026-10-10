/**
 * Mock interceptor for the cards API.
 *
 * @remarks
 * Intercepts HTTP requests to the cards API and returns data from
 * `ContentSeedRepository` instead of hitting a real backend.
 *
 * Active when `environment.useCardsApiMock` is `true`.
 *
 * Supported requests:
 * - POST /cards/search — search cards with filters
 * - GET /cards/{id} — fetch a single card by ID
 * - POST /cards/batch — fetch multiple cards by IDs
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useCardsApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { parseCardSearchCriteria } from './cards-api.params.utils';
import { isApiRequest } from '../api-url';
import { CardsCatalogMockHandler } from './cards-catalog.mock.handler';

/**
 * Checks whether the given URL is a cards search request.
 *
 * @param url - The request URL to check.
 * @returns `true` if the URL is an API request targeting `/cards/search`.
 */
const isCardsSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/cards/search');

/**
 * Extracts the card ID from an API URL.
 *
 * @param url - The request URL.
 * @returns The card ID, or `null` if the URL does not target a specific card.
 */
const extractCardId = (url: string): string | null => {
  const prefix = `${environment.apiUrl}/cards/`;
  if (!url.includes(prefix)) {
    return null;
  }

  const id = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  return id && id !== 'search' ? id : null;
};

/**
 * HTTP interceptor that mocks cards API responses for development.
 *
 * @remarks
 * Handles GET (search, getById), POST (search, batch) requests for the
 * cards endpoint. Delegates to `CardsCatalogMockHandler` for data operations.
 *
 * Algorithm:
 * 1. If the request is not GET or not an API request — pass through (`next`).
 * 2. If `POST /cards/search` — search cards by criteria.
 * 3. If `GET /cards/{id}` — fetch a single card by ID.
 * 4. If `POST /cards/batch` — fetch multiple cards by IDs.
 * 5. Otherwise — pass through (`next`).
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const cardsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  const handler = inject(CardsCatalogMockHandler);

  // POST /cards/batch — пакетное получение карточек
  if (
    req.method === 'POST' &&
    isApiRequest(req.url) &&
    req.url.endsWith(`${environment.apiUrl}/cards/batch`)
  ) {
    const body = req.body as { ids?: readonly string[] };
    const ids = body?.ids ?? [];

    return defer(() => handler.getByIds(ids)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // Проверяем, что это GET-запрос к API
  if (req.method !== 'GET' || !isApiRequest(req.url)) {
    return next(req);
  }

  // POST /cards/search — поиск карточек
  if (isCardsSearchRequest(req.url)) {
    const criteria = parseCardSearchCriteria(req.params);

    return defer(() => handler.search(criteria)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // GET /cards/{id} — получение карточки по ID
  const cardId = extractCardId(req.url);
  if (cardId) {
    return defer(() => handler.getById(cardId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  // Пропускаем запрос дальше
  return next(req);
};
