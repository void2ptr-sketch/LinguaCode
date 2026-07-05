/**
 * Mock-интерсептор для API карточек.
 *
 * Перехватывает HTTP-запросы к API карточек и возвращает данные
 * из ContentSeedRepository вместо реального бэкенда.
 *
 * Используется когда environment.useCardsApiMock = true.
 *
 * Поддерживаемые запросы:
 * - POST /cards/search — поиск карточек с фильтрами
 * - GET /cards/{id} — получение карточки по ID
 * - POST /cards/batch — получение нескольких карточек по ID
 *
 * Пример использования:
 * ```typescript
 * // В environment.ts:
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
 * Проверяет, является ли запрос поиском карточек.
 *
 * @param url — URL запроса
 * @returns true если это POST-запрос к /cards/search
 */
const isCardsSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/cards/search');

/**
 * Извлекает ID карточки из URL.
 *
 * Формат URL: /api/cards/{id}
 *
 * @param url — URL запроса
 * @returns ID карточки или null если не найден
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
 * Mock-интерсептор для API карточек.
 *
 * Перехватывает GET и POST запросы к API карточек и возвращает
 * данные из ContentSeedRepository вместо реального бэкенда.
 *
 * Алгоритм:
 * 1. Если запрос не GET или не к API — пропускает (next)
 * 2. Если POST /cards/search — ищет карточки по критериям
 * 3. Если GET /cards/{id} — получает карточку по ID
 * 4. Если POST /cards/batch — получает несколько карточек по ID
 * 5. Иначе — пропускает (next)
 *
 * @param req — HTTP-запрос
 * @param next — следующий интерсептор
 * @returns Observable с HTTP-ответом
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
