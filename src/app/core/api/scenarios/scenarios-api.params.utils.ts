import { HttpParams } from '@angular/common/http';

import type {
  ScenarioCardSourceMode,
  ScenarioListScope,
  ScenarioSearchCriteria,
} from '../../models';
import { isContentLanguage } from '../../domain/language-pair/language-pair.utils';
import { DEFAULT_PAGE_SIZE } from '../../../shared/utils/pagination';

/**
 * Builds `HttpParams` from a `ScenarioSearchCriteria` object.
 *
 * Serialises all non-empty criteria fields (query, author, scope, card source
 * mode, languages, course ID, pagination) into query parameters.
 *
 * @param criteria - The search criteria to serialise.
 * @returns An `HttpParams` instance ready for HTTP requests.
 */
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

  if (criteria.knownLanguage) {
    params = params.set('knownLanguage', criteria.knownLanguage);
  }

  if (criteria.learningLanguage) {
    params = params.set('learningLanguage', criteria.learningLanguage);
  }

  if (criteria.courseId) {
    params = params.set('courseId', criteria.courseId);
  }

  return params;
}

export function parseScenarioSearchCriteria(params: HttpParams): ScenarioSearchCriteria {
  const scope = params.get('scope') as ScenarioListScope | null;
  const cardSourceMode = params.get('cardSourceMode') as ScenarioCardSourceMode | null;
  const knownLanguage = params.get('knownLanguage');
  const learningLanguage = params.get('learningLanguage');

  return {
    query: params.get('query') ?? undefined,
    authorId: params.get('authorId') ?? undefined,
    scope: scope ?? undefined,
    cardSourceMode: cardSourceMode ?? undefined,
    knownLanguage: isContentLanguage(knownLanguage) ? knownLanguage : undefined,
    learningLanguage: isContentLanguage(learningLanguage) ? learningLanguage : undefined,
    courseId: params.get('courseId') ?? undefined,
    page: {
      page: Number(params.get('page') ?? 0),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    },
  };
}
