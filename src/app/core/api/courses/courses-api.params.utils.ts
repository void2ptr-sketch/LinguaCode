import { HttpParams } from '@angular/common/http';

import type { CourseListScope, CourseSearchCriteria } from '../../models';
import { isContentLanguage } from '../../domain/language-pair/language-pair.utils';
import { DEFAULT_PAGE_SIZE } from '../../../shared/utils/pagination';

/**
 * Builds `HttpParams` from a `CourseSearchCriteria` object.
 *
 * Serialises all non-empty criteria fields (query, author, scope, languages,
 * pagination) into query parameters.
 *
 * @param criteria - The search criteria to serialise.
 * @returns An `HttpParams` instance ready for HTTP requests.
 */
export function buildCourseSearchParams(criteria: CourseSearchCriteria): HttpParams {
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

  if (criteria.knownLanguage) {
    params = params.set('knownLanguage', criteria.knownLanguage);
  }

  if (criteria.learningLanguage) {
    params = params.set('learningLanguage', criteria.learningLanguage);
  }

  return params;
}

export function parseCourseSearchCriteria(params: HttpParams): CourseSearchCriteria {
  const scope = params.get('scope') as CourseListScope | null;
  const knownLanguage = params.get('knownLanguage');
  const learningLanguage = params.get('learningLanguage');

  return {
    query: params.get('query') ?? undefined,
    authorId: params.get('authorId') ?? undefined,
    scope: scope ?? undefined,
    knownLanguage: isContentLanguage(knownLanguage) ? knownLanguage : undefined,
    learningLanguage: isContentLanguage(learningLanguage) ? learningLanguage : undefined,
    page: {
      page: Number(params.get('page') ?? 0),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    },
  };
}
