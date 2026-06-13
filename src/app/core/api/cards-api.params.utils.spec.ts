import { HttpParams } from '@angular/common/http';

import { buildCardSearchParams, parseCardSearchCriteria } from './cards-api.params.utils';

describe('cards-api.params.utils', () => {
  it('builds and parses search params', () => {
    const criteria = {
      query: 'hello',
      knownLanguage: 'ru' as const,
      learningLanguage: 'en' as const,
      difficulty: 'beginner' as const,
      kinds: ['select', 'memory'] as const,
      tags: ['vocabulary'],
      page: { page: 1, pageSize: 25 },
    };

    const params = buildCardSearchParams(criteria);
    expect(parseCardSearchCriteria(params)).toEqual(criteria);
  });

  it('parses empty optional filters', () => {
    const params = new HttpParams().set('page', '0').set('pageSize', '50');
    const criteria = parseCardSearchCriteria(params);

    expect(criteria.page).toEqual({ page: 0, pageSize: 50 });
    expect(criteria.query).toBeUndefined();
    expect(criteria.knownLanguage).toBeUndefined();
    expect(criteria.learningLanguage).toBeUndefined();
    expect(criteria.kinds).toBeUndefined();
    expect(criteria.tags).toBeUndefined();
  });
});
