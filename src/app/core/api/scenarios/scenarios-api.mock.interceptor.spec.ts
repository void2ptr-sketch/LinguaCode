import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ScenariosApiService } from '../../repositories/scenarios/api/scenarios-api.service';
import { scenariosApiMockInterceptor } from './scenarios-api.mock.interceptor';

describe('scenarios API (mock interceptor)', () => {
  let api: ScenariosApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ScenariosApiService,
        provideHttpClient(withFetch(), withInterceptors([scenariosApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(ScenariosApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('searches scenarios via GET /api/scenarios/search', async () => {
    const page = await api.search({
      scope: 'all',
      learningLanguage: 'en',
      page: { page: 0, pageSize: 10 },
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.totalItems).toBeGreaterThan(0);
  });

  it('loads scenario by id via GET /api/scenarios/:id', async () => {
    const scenario = await api.getById('demo-scenario');

    expect(scenario).toBeDefined();
    expect(scenario.id).toBe('demo-scenario');
  });

  it('returns 404 for unknown scenario id', async () => {
    await expect(api.getById('missing-scenario')).rejects.toThrow();
  });

  it('finds scenarios using a card via GET /api/scenarios/by-card/:id', async () => {
    const scenarios = await api.findUsingCard('select-1');

    expect(Array.isArray(scenarios)).toBe(true);
  });

  it('searches scenarios with all criteria params', async () => {
    const page = await api.search({
      query: 'test',
      scope: 'published',
      knownLanguage: 'zh',
      learningLanguage: 'en',
      page: { page: 0, pageSize: 5 },
    });

    expect(page.items).toBeDefined();
    expect(page.totalItems).toBeDefined();
  });
});
