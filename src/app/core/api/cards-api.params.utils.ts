import { HttpParams } from '@angular/common/http';

import type { CardSearchCriteria, CardKind, ContentLanguage, CardDifficulty } from '../models';
import { DEFAULT_PAGE_SIZE } from '../../shared/pagination';

export function buildCardSearchParams(criteria: CardSearchCriteria): HttpParams {
  let params = new HttpParams()
    .set('page', String(criteria.page.page))
    .set('pageSize', String(criteria.page.pageSize));

  if (criteria.query) {
    params = params.set('query', criteria.query);
  }

  if (criteria.knownLanguage) {
    params = params.set('knownLanguage', criteria.knownLanguage);
  }

  if (criteria.learningLanguage) {
    params = params.set('learningLanguage', criteria.learningLanguage);
  }

  if (criteria.difficulty) {
    params = params.set('difficulty', criteria.difficulty);
  }

  for (const kind of criteria.kinds ?? []) {
    params = params.append('kinds', kind);
  }

  for (const tag of criteria.tags ?? []) {
    params = params.append('tags', tag);
  }

  return params;
}

export function parseCardSearchCriteria(params: HttpParams): CardSearchCriteria {
  const kinds = (params.getAll('kinds') ?? []) as CardKind[];
  const tags = params.getAll('tags') ?? [];

  return {
    query: params.get('query') ?? undefined,
    knownLanguage: (params.get('knownLanguage') as ContentLanguage | null) ?? undefined,
    learningLanguage: (params.get('learningLanguage') as ContentLanguage | null) ?? undefined,
    difficulty: (params.get('difficulty') as CardDifficulty | null) ?? undefined,
    kinds: kinds.length > 0 ? kinds : undefined,
    tags: tags.length > 0 ? tags : undefined,
    page: {
      page: Number(params.get('page') ?? 0),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    },
  };
}
