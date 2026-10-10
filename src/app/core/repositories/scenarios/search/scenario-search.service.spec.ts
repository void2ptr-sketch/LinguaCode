import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { PageResponse } from '../../../../shared/utils/pagination';
import type { Scenario, ScenarioIndexEntry } from '../../../models';
import { ScenarioSearchService } from './scenario-search.service';
import { ScenariosApiService } from '../api/scenarios-api.service';
import { scenariosApiMockInterceptor } from '../../../api/scenarios/scenarios-api.mock.interceptor';

describe('ScenarioSearchService', () => {
  let service: ScenarioSearchService;
  let apiService: ScenariosApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ScenarioSearchService,
        ScenariosApiService,
        provideHttpClient(withFetch(), withInterceptors([scenariosApiMockInterceptor])),
      ],
    });

    service = TestBed.inject(ScenarioSearchService);
    apiService = TestBed.inject(ScenariosApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('search', () => {
    it('delegates to ScenariosApiService.search', async () => {
      const searchSpy = vi.spyOn(apiService, 'search').mockResolvedValue({
        items: [],
        totalItems: 0,
        page: 0,
        pageSize: 10,
        totalPages: 0,
      } as PageResponse<ScenarioIndexEntry>);

      await service.search({ page: { page: 0, pageSize: 10 } });

      expect(searchSpy).toHaveBeenCalledWith({ page: { page: 0, pageSize: 10 } });
    });

    it('sets loading state during search', async () => {
      let resolveAction: () => void;
      const searchPromise = new Promise<void>((r) => (resolveAction = r));
      vi.spyOn(apiService, 'search').mockReturnValue(searchPromise as unknown as Promise<PageResponse<ScenarioIndexEntry>>);

      void service.search({ page: { page: 0, pageSize: 10 } });

      expect(service.loading()).toBe(true);
      expect(service.error()).toBeNull();

      resolveAction!();
      await searchPromise;
      expect(service.loading()).toBe(false);
    });

    it('sets error message when API call fails', async () => {
      vi.spyOn(apiService, 'search').mockRejectedValue(new Error('API error'));

      await expect(service.search({ page: { page: 0, pageSize: 10 } })).rejects.toThrow();

      expect(service.error()).toBe('Не удалось выполнить операцию со сценариями');
      expect(service.loading()).toBe(false);
    });
  });

  describe('getById', () => {
    it('delegates to ScenariosApiService.getById', async () => {
      const mockScenario = {
        id: 'scenario-1',
        title: 'Test',
        description: '',
        authorId: 'user-1',
        published: true,
        updatedAt: new Date().toISOString(),
        cardSource: { mode: 'fixed' as const, cardIds: [] },
        languagePair: { known: 'en', learning: 'zh' },
      };
      const spy = vi.spyOn(apiService, 'getById').mockResolvedValue(mockScenario as Scenario);

      await service.getById('scenario-1');

      expect(spy).toHaveBeenCalledWith('scenario-1');
    });
  });

  describe('create', () => {
    it('delegates to ScenariosApiService.create', async () => {
      const mockScenario = {
        id: 'new-scenario',
        title: 'New',
        description: '',
        authorId: 'user-1',
        published: false,
        updatedAt: new Date().toISOString(),
        cardSource: { mode: 'fixed' as const, cardIds: [] },
        languagePair: { known: 'en', learning: 'zh' },
      };
      const spy = vi.spyOn(apiService, 'create').mockResolvedValue(mockScenario as Scenario);

      await service.create({
        title: 'New Scenario',
        description: '',
        published: false,
        cardSource: { mode: 'fixed', cardIds: [] },
      });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('delegates to ScenariosApiService.update', async () => {
      const mockScenario = {
        id: 'scenario-1',
        title: 'Updated',
        description: '',
        authorId: 'user-1',
        published: true,
        updatedAt: new Date().toISOString(),
        cardSource: { mode: 'fixed' as const, cardIds: [] },
        languagePair: { known: 'en', learning: 'zh' },
      };
      const payload = {
        title: 'Updated',
        description: '',
        published: true,
        cardSource: { mode: 'fixed' as const, cardIds: [] } as Scenario['cardSource'],
      };
      const spy = vi.spyOn(apiService, 'update').mockResolvedValue(mockScenario as Scenario);

      await service.update('scenario-1', payload);

      expect(spy).toHaveBeenCalledWith('scenario-1', payload);
    });
  });

  describe('delete', () => {
    it('delegates to ScenariosApiService.delete', async () => {
      const spy = vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

      await service.delete('scenario-1');

      expect(spy).toHaveBeenCalledWith('scenario-1');
    });
  });

  describe('findUsingCard', () => {
    it('delegates to ScenariosApiService.findUsingCard', async () => {
      const mockEntries = [
        {
          id: 's1',
          title: 'Test',
          authorId: 'u1',
          lessonCount: 0,
          published: true,
          updatedAt: '',
          languagePairSummary: '',
          cardSourceMode: 'fixed' as const,
          cardSourceSummary: '',
        },
      ];
      const spy = vi.spyOn(apiService, 'findUsingCard').mockResolvedValue(mockEntries);

      await service.findUsingCard('card-1');

      expect(spy).toHaveBeenCalledWith('card-1');
    });
  });

  describe('error handling', () => {
    it('resets error on successful call after previous failure', async () => {
      vi.spyOn(apiService, 'search').mockRejectedValue(new Error('fail'));
      await service.search({ page: { page: 0, pageSize: 10 } }).catch(() => undefined);
      expect(service.error()).toBe('Не удалось выполнить операцию со сценариями');

      vi.spyOn(apiService, 'search').mockResolvedValue({
        items: [],
        totalItems: 0,
        page: 0,
        pageSize: 10,
        totalPages: 0,
      } as PageResponse<ScenarioIndexEntry>);
      await service.search({ page: { page: 0, pageSize: 10 } });

      expect(service.error()).toBeNull();
    });
  });
});
