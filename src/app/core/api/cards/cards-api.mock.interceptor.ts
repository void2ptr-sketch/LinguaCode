import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { parseCardSearchCriteria } from './cards-api.params.utils';
import { isApiRequest } from '../api-url';
import { CardsCatalogMockHandler } from './cards-catalog.mock.handler';

const isCardsSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/cards/search');

const extractCardId = (url: string): string | null => {
  const prefix = `${environment.apiUrl}/cards/`;
  if (!url.includes(prefix)) {
    return null;
  }

  const id = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  return id && id !== 'search' ? id : null;
};

export const cardsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  const handler = inject(CardsCatalogMockHandler);

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

  if (req.method !== 'GET' || !isApiRequest(req.url)) {
    return next(req);
  }

  if (isCardsSearchRequest(req.url)) {
    const criteria = parseCardSearchCriteria(req.params);

    return defer(() => handler.search(criteria)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const cardId = extractCardId(req.url);
  if (cardId) {
    return defer(() => handler.getById(cardId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  return next(req);
};
