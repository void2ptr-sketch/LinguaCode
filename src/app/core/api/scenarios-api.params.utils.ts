import { HttpParams } from '@angular/common/http';

import type {
  ScenarioCardSourceMode,
  ScenarioListScope,
  ScenarioSearchCriteria,
} from '../models';
import { DEFAULT_PAGE_SIZE } from '../../shared/pagination';

export function buildScenarioSearchParams(criteria: ScenarioSearchCriteria): HttpParams {
  let params = new HttpParams()
    .set('page', String(criteria.page.page))
    .set('pageSize', String(criteria.page.pageSize));

  if (criteria.query) {
    params = params.set('query', criteria.query);
  }

  if (criteria.authorId) {
    params = params.set('authorId', criteria.authorId);
  }

  if (criteria.scope) {
    params = params.set('scope', criteria.scope);
  }

  if (criteria.cardSourceMode) {
    params = params.set('cardSourceMode', criteria.cardSourceMode);
  }

  return params;
}

export function parseScenarioSearchCriteria(params: HttpParams): ScenarioSearchCriteria {
  const scope = params.get('scope') as ScenarioListScope | null;
  const cardSourceMode = params.get('cardSourceMode') as ScenarioCardSourceMode | null;

  return {
    query: params.get('query') ?? undefined,
    authorId: params.get('authorId') ?? undefined,
    scope: scope ?? undefined,
    cardSourceMode: cardSourceMode ?? undefined,
    page: {
      page: Number(params.get('page') ?? 0),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    },
  };
}
