import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardsApiService, CardSearchService } from '../../../entities/card';
import { ScenarioSearchService } from '../../../entities/scenario';
import { UserStore } from '../../../entities/user/model/user.store';
import { CardSelectService } from './card-select.service';

const createMockScenario = (cardSource: {
  mode: 'fixed' | 'snapshot' | 'criteria';
  cardIds?: string[];
  limit?: number;
}) => ({
  id: 'demo-scenario',
  title: 'Demo',
  description: '',
  authorId: 'local-user',
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePair: { known: 'ru', learning: 'en' },
  cardSource,
});

describe('CardSelectService', () => {
  const selectCard = {
    id: 'select-1',
    kind: 'select' as const,
    title: 'Приветствие',
    appearance: { theme: 'azure-blue', fontSize: 'md' as const },
    direction: 'known-to-learning' as const,
    promptKnown: 'Q?',
    optionsLearning: ['A', 'B'],
    correctIndex: 0,
  };

  const keyboardCard = {
    id: 'keyboard-1',
    kind: 'keyboard' as const,
    title: 'Напиши',
    appearance: { theme: 'azure-blue', fontSize: 'md' as const },
    direction: 'known-to-learning' as const,
    promptKnown: 'Type hi',
    acceptedAnswersKnown: ['hi'],
  };

  describe('loadScenario', () => {
    it('should return card IDs for a fixed scenario', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'fixed', cardIds: ['select-1'] }),
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('demo-scenario');

      expect(session.scenarioId).toBe('demo-scenario');
      expect(session.cardIds).toEqual(['select-1']);
      expect(session.missingCardIds).toEqual([]);
      expect(session.scenarioSourceLabel).toBe('1 карточек');
    });

    it('should format source label for fixed mode with multiple cards', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () =>
                createMockScenario({ mode: 'fixed', cardIds: ['c1', 'c2', 'c3'] }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [
                { ...selectCard, id: 'c1' },
                { ...keyboardCard, id: 'c2' },
                { ...selectCard, id: 'c3' },
              ],
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('s1');
      expect(session.scenarioSourceLabel).toBe('3 карточек');
    });

    it('should format source label for snapshot mode', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'snapshot', cardIds: ['c1'] }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [{ ...selectCard, id: 'c1' }],
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('s3');
      expect(session.scenarioSourceLabel).toBe('1 карточек (snapshot)');
    });

    it('should format source label for criteria mode with limit', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'criteria', limit: 30 }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [selectCard],
            },
          },
          {
            provide: CardSearchService,
            useValue: {
              search: async () => ({
                items: [{ id: 'select-1', updatedAt: '2026-01-01T00:00:00.000Z' }],
                total: 1,
                page: 0,
                pageSize: 30,
              }),
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('s4');
      expect(session.scenarioSourceLabel).toBe('до 30 по критериям');
    });

    it('should format source label for criteria mode without limit', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'criteria' }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [selectCard],
            },
          },
          {
            provide: CardSearchService,
            useValue: {
              search: async () => ({
                items: [{ id: 'select-1', updatedAt: '2026-01-01T00:00:00.000Z' }],
                total: 1,
                page: 0,
                pageSize: 50,
              }),
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('s5');
      expect(session.scenarioSourceLabel).toBe('до 50 по критериям');
    });

    it('should resolve card IDs from criteria source', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'criteria', limit: 30 }),
            },
          },
          {
            provide: CardSearchService,
            useValue: {
              search: async () => ({
                items: [
                  { id: 'card-a', updatedAt: '2026-01-02T00:00:00.000Z', difficulty: 'beginner' },
                  { id: 'card-b', updatedAt: '2026-01-01T00:00:00.000Z', difficulty: 'beginner' },
                ],
                total: 2,
                page: 0,
                pageSize: 30,
              }),
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const session = await service.loadScenario('s6');
      // Sorted by updatedAt (descending)
      expect(session.cardIds).toEqual(['card-a', 'card-b']);
      expect(session.scenarioSourceLabel).toBe('до 30 по критериям');
    });

    it('should throw error when scenario has no cards', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'fixed', cardIds: [] }),
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      await expect(service.loadScenario('s7')).rejects.toThrow('SCENARIO_EMPTY');
    });

    it('should throw error when language pair does not match', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => ({
                ...createMockScenario({ mode: 'fixed', cardIds: ['select-1'] }),
                languagePair: { known: 'en', learning: 'ja' },
              }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [selectCard],
            },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      await expect(service.loadScenario('s8')).rejects.toThrow('SCENARIO_LANGUAGE_PAIR_MISMATCH');
    });
  });

  describe('loadPageByIds', () => {
    it('should return empty array for empty input', async () => {
      const getByIds = vi.fn().mockResolvedValue([selectCard]);
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          { provide: CardsApiService, useValue: { getByIds } },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const cards = await service.loadPageByIds([]);

      expect(cards).toEqual([]);
      expect(getByIds).not.toHaveBeenCalled();
    });

    it('should delegate to CardsApiService.getByIds', async () => {
      const getByIds = vi.fn().mockResolvedValue([selectCard, keyboardCard]);
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          { provide: CardsApiService, useValue: { getByIds } },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const cards = await service.loadPageByIds(['select-1', 'keyboard-1']);

      expect(getByIds).toHaveBeenCalledWith(['select-1', 'keyboard-1']);
      expect(cards.length).toBe(2);
    });
  });

  describe('searchScenarios', () => {
    it('should search scenarios with query and pagination', async () => {
      const searchSpy = vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 0,
        pageSize: 10,
      });

      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: { search: searchSpy },
          },
          {
            provide: UserStore,
            useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      const result = await service.searchScenarios('test', 0, 10);

      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          scope: 'published',
          page: { page: 0, pageSize: 10 },
        }),
      );
      expect(result).toEqual({ items: [], total: 0, page: 0, pageSize: 10 });
    });

    it('should treat empty query as undefined', async () => {
      const searchSpy = vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 0,
        pageSize: 10,
      });

      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: { search: searchSpy },
          },
          {
            provide: UserStore,
            useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) },
          },
          provideHttpClient(),
        ],
      });

      const service = TestBed.inject(CardSelectService);
      await service.searchScenarios('  ', 1, 20);

      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          page: { page: 1, pageSize: 20 },
        }),
      );
    });
  });
});
