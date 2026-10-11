import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ContentLanguage, ScenarioCardSort } from '../../models';

const makeLanguagePair = (known: ContentLanguage, learning: ContentLanguage) => ({ known, learning });

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

  describe('search', () => {
    it('returns paginated results', async () => {
      const page = await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });

      expect(page.items).toBeDefined();
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.totalItems).toBeGreaterThan(0);
      expect(page.page).toBe(0);
      expect(page.pageSize).toBe(10);
    });

    it('returns paginated results with scope filter', async () => {
      const page = await api.search({ scope: 'published', learningLanguage: 'en' as ContentLanguage, page: { page: 0, pageSize: 10 } });

      expect(page.items).toBeDefined();
      expect(page.totalItems).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns scenario by ID', async () => {
      const scenario = await api.getById('demo-scenario');

      expect(scenario).toBeDefined();
      expect(scenario.id).toBe('demo-scenario');
      expect(scenario.title).toBeDefined();
    });

    it('throws 404 for non-existent scenario', async () => {
      await expect(api.getById('non-existent-scenario-id')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates a new scenario with criteria-based card source', async () => {
      const payload = {
        title: 'Criteria Scenario',
        description: 'Criteria-based scenario',
        published: true,
        languagePair: makeLanguagePair('en', 'zh'),
        cardSource: {
          mode: 'criteria' as const,
          criteria: { knownLanguage: 'en' as ContentLanguage, learningLanguage: 'zh' as ContentLanguage },
          limit: 10,
          sort: 'updatedAt' as ScenarioCardSort,
        },
      };

      const created = await api.create(payload);

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Criteria Scenario');
      expect(created.cardSource.mode).toBe('criteria');
    });
  });

  describe('update', () => {
    it('updates scenario title and description', async () => {
      const payload = {
        title: 'Updated Scenario Title',
        description: 'Updated description',
        published: true,
        languagePair: makeLanguagePair('en', 'zh'),
        cardSource: {
          mode: 'criteria' as const,
          criteria: { knownLanguage: 'en' as ContentLanguage, learningLanguage: 'zh' as ContentLanguage },
        },
      };

      const updated = await api.update('demo-scenario', payload);

      expect(updated.title).toBe('Updated Scenario Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.published).toBe(true);
    });

    it('throws 404 for non-existent scenario', async () => {
      const payload = {
        title: 'Should Fail',
        description: '',
        published: false,
        languagePair: makeLanguagePair('en', 'zh'),
        cardSource: { mode: 'criteria' as const, criteria: { knownLanguage: 'en' as ContentLanguage } },
      };

      await expect(api.update('non-existent-id', payload)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('throws 404 for non-existent scenario', async () => {
      await expect(api.delete('non-existent-id')).rejects.toThrow();
    });
  });

  describe('findUsingCard', () => {
    it('finds scenarios that use a specific card', async () => {
      const scenarios = await api.findUsingCard('demo-card-1');

      expect(Array.isArray(scenarios)).toBe(true);
    });

    it('returns empty array when no scenarios use the card', async () => {
      const scenarios = await api.findUsingCard('non-existent-card');

      expect(scenarios).toEqual([]);
    });
  });
});
