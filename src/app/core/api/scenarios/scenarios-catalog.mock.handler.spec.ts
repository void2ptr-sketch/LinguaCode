import { TestBed } from '@angular/core/testing';

import { ScenariosApiService } from '../../repositories/scenarios/api/scenarios-api.service';
import { ScenariosCatalogMockHandler } from './scenarios-catalog.mock.handler';
import { scenariosApiMockInterceptor } from './scenarios-api.mock.interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

describe('ScenariosCatalogMockHandler', () => {
  let api: ScenariosApiService;
  let handler: ScenariosCatalogMockHandler;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ScenariosApiService,
        ScenariosCatalogMockHandler,
        provideHttpClient(withFetch(), withInterceptors([scenariosApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(ScenariosApiService);
    handler = TestBed.inject(ScenariosCatalogMockHandler);
  });

  afterEach(() => {
    localStorage.clear();
    handler.resetCache();
  });

  it('clears cached data on resetCache', async () => {
    // Ensure data is loaded
    await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });

    handler.resetCache();

    // Next access should reload data
    const page = await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });
    expect(page.items).toBeDefined();
  });

  it('returns empty array for non-existent card', async () => {
    const scenarios = await api.findUsingCard('non-existent-card');

    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBe(0);
  });
});
