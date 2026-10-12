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
    it('should load cards for scenario via API batch', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'fixed', cardIds: ['select-1'] }),
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
      const session = await service.loadScenario('demo-scenario');

      expect(session.scenarioId).toBe('demo-scenario');
      expect(session.cards.length).toBe(1);
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

    it('should include missing card IDs when some cards are not found', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () =>
                createMockScenario({ mode: 'fixed', cardIds: ['select-1', 'missing-1'] }),
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
      const session = await service.loadScenario('s6');
      expect(session.cards.length).toBe(1);
      expect(session.missingCardIds).toEqual(['missing-1']);
    });

    it('should throw error when scenario has no cards', async () => {
      TestBed.configureTestingModule({
        providers: [
          CardSelectService,
          {
            provide: ScenarioSearchService,
            useValue: {
              getById: async () => createMockScenario({ mode: 'fixed', cardIds: ['nonexistent'] }),
            },
          },
          {
            provide: CardsApiService,
            useValue: {
              getByIds: async () => [],
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
