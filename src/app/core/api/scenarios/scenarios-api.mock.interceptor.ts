import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { parseScenarioSearchCriteria } from './scenarios-api.params.utils';
import { isApiRequest } from '../api-url';
import { ScenariosCatalogMockHandler } from './scenarios-catalog.mock.handler';

import type { ScenarioWritePayload } from '../../data/scenarios/scenarios-api.service';

const isScenariosSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/scenarios/search');

const extractScenarioId = (url: string): string | null => {
  const prefix = `${environment.apiUrl}/scenarios/`;
  if (!url.includes(prefix)) {
    return null;
  }

  const rest = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  if (!rest || rest === 'search') {
    return null;
  }

  if (rest.startsWith('by-card/')) {
    return null;
  }

  return rest;
};

const extractCardIdFromScenarioUsage = (url: string): string | null => {
  const marker = `${environment.apiUrl}/scenarios/by-card/`;
  if (!url.includes(marker)) {
    return null;
  }

  return url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0] || null;
};

export const scenariosApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(ScenariosCatalogMockHandler);

  if (req.method === 'GET' && isScenariosSearchRequest(req.url)) {
    const criteria = parseScenarioSearchCriteria(req.params);

    return defer(() => handler.search(criteria)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const usageCardId = extractCardIdFromScenarioUsage(req.url);
  if (req.method === 'GET' && usageCardId) {
    return defer(() => handler.findUsingCard(usageCardId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const scenarioId = extractScenarioId(req.url);
  if (req.method === 'GET' && scenarioId) {
    return defer(() => handler.getById(scenarioId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'POST' && req.url.endsWith(`${environment.apiUrl}/scenarios`)) {
    const payload = req.body as ScenarioWritePayload;

    return defer(() => handler.create(payload)).pipe(
      map((data) => new HttpResponse({ status: 201, body: { data } })),
    );
  }

  if (req.method === 'PUT' && scenarioId) {
    const payload = req.body as ScenarioWritePayload;

    return defer(() => handler.update(scenarioId, payload)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'DELETE' && scenarioId) {
    return defer(() => handler.delete(scenarioId)).pipe(
      map(() => new HttpResponse({ status: 200, body: { data: null } })),
    );
  }

  return next(req);
};
