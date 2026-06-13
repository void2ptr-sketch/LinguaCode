import { HttpParams } from '@angular/common/http';

import { buildScenarioSearchParams, parseScenarioSearchCriteria } from './scenarios-api.params.utils';

describe('scenarios-api.params.utils', () => {
  it('should build and parse scenario search params', () => {
    const criteria = {
      query: 'demo',
      scope: 'published' as const,
      page: { page: 1, pageSize: 25 },
    };

    const params = buildScenarioSearchParams(criteria);
    const parsed = parseScenarioSearchCriteria(params);

    expect(parsed.query).toBe('demo');
    expect(parsed.scope).toBe('published');
    expect(parsed.page.page).toBe(1);
    expect(parsed.page.pageSize).toBe(25);
  });

  it('should parse empty params with defaults', () => {
    const parsed = parseScenarioSearchCriteria(new HttpParams());
    expect(parsed.page.page).toBe(0);
    expect(parsed.page.pageSize).toBeGreaterThan(0);
  });
});
