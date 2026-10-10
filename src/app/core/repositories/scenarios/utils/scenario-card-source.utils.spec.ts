import { describe, expect, it, vi } from 'vitest';

import type { CardIndexEntry, LanguagePair } from '../../../../core/models';
import type { LegacyScenario } from '../../../models/scenario.types';
import type { CardSearchService } from '../../cards/search/card-search.service';
import {
  DEFAULT_CRITERIA_LIMIT,
  buildSnapshotCardSource,
  emptyCardSearchCriteria,
  hasCardSearchFilters,
  normalizeScenario,
  resolveScenarioCardIds,
  scenarioCardsLabel,
  scenarioMatchesLanguagePair,
  scenarioUsesCardEntry,
  scenarioUsesCardId,
  sortCardIndexEntries,
  validateScenarioCardSource,
} from './scenario-card-source.utils';
import type { Scenario, ScenarioCardSource } from '../../../../core/models';

describe('scenario-card-source.utils', () => {
  describe('DEFAULT_CRITERIA_LIMIT', () => {
    it('should be 50', () => {
      expect(DEFAULT_CRITERIA_LIMIT).toBe(50);
    });
  });

  describe('emptyCardSearchCriteria', () => {
    it('should return an empty object', () => {
      const criteria = emptyCardSearchCriteria();
      expect(criteria).toEqual({});
    });
  });

  describe('hasCardSearchFilters', () => {
    it('should return false for empty criteria', () => {
      expect(hasCardSearchFilters({})).toBe(false);
    });

    it('should return true when query is provided', () => {
      expect(hasCardSearchFilters({ query: 'test' })).toBe(true);
    });

    it('should return true when knownLanguage is provided', () => {
      expect(hasCardSearchFilters({ knownLanguage: 'en' })).toBe(true);
    });

    it('should return true when learningLanguage is provided', () => {
      expect(hasCardSearchFilters({ learningLanguage: 'zh' })).toBe(true);
    });

    it('should return true when difficulty is provided', () => {
      expect(hasCardSearchFilters({ difficulty: 'beginner' })).toBe(true);
    });

    it('should return true when kinds array has items', () => {
      expect(hasCardSearchFilters({ kinds: ['select', 'memory'] })).toBe(true);
    });

    it('should return false when kinds array is empty', () => {
      expect(hasCardSearchFilters({ kinds: [] })).toBe(false);
    });

    it('should return true when tags array has items', () => {
      expect(hasCardSearchFilters({ tags: ['hsk1'] })).toBe(true);
    });

    it('should return false when tags array is empty', () => {
      expect(hasCardSearchFilters({ tags: [] })).toBe(false);
    });

    it('should return false when query is whitespace only', () => {
      expect(hasCardSearchFilters({ query: '   ' })).toBe(false);
    });
  });

  describe('scenarioUsesCardId', () => {
    it('should return true for fixed mode with matching cardId', () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      };
      expect(scenarioUsesCardId(source, 'card-1')).toBe(true);
    });

    it('should return false for fixed mode with non-matching cardId', () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      };
      expect(scenarioUsesCardId(source, 'card-3')).toBe(false);
    });

    it('should return true for snapshot mode with matching cardId', () => {
      const source: ScenarioCardSource = {
        mode: 'snapshot',
        cardIds: ['card-1', 'card-2'],
        criteria: {},
        frozenAt: '2024-01-01T00:00:00Z',
      };
      expect(scenarioUsesCardId(source, 'card-2')).toBe(true);
    });

    it('should return false for criteria mode', () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: {},
      };
      expect(scenarioUsesCardId(source, 'card-1')).toBe(false);
    });
  });

  describe('scenarioUsesCardEntry', () => {
    it('should return true for fixed mode with matching entry id', () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      };
      const entry: CardIndexEntry = {
        id: 'card-1',
        title: 'Test',
        kind: 'select',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
        difficulty: 'beginner',
        updatedAt: '2024-01-01',
      };
      expect(scenarioUsesCardEntry(source, entry)).toBe(true);
    });

    it('should return false for fixed mode with non-matching entry id', () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1'],
      };
      const entry: CardIndexEntry = {
        id: 'card-2',
        title: 'Test',
        kind: 'select',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
        difficulty: 'beginner',
        updatedAt: '2024-01-01',
      };
      expect(scenarioUsesCardEntry(source, entry)).toBe(false);
    });

    it('should use matchesCardIndexEntry for criteria mode', () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: { kinds: ['select'] },
      };
      const entry: CardIndexEntry = {
        id: 'card-1',
        title: 'Test',
        kind: 'select',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
        difficulty: 'beginner',
        updatedAt: '2024-01-01',
      };
      expect(scenarioUsesCardEntry(source, entry)).toBe(true);
    });
  });

  describe('scenarioCardsLabel', () => {
    it('should return label for fixed mode', () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2', 'card-3'],
      };
      expect(scenarioCardsLabel(source)).toBe('3 карточек');
    });

    it('should return label for snapshot mode', () => {
      const source: ScenarioCardSource = {
        mode: 'snapshot',
        cardIds: ['card-1'],
        criteria: {},
        frozenAt: '2024-01-01T00:00:00Z',
      };
      expect(scenarioCardsLabel(source)).toBe('1 карточек (snapshot)');
    });

    it('should return criteria label for criteria mode', () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: {},
      };
      expect(scenarioCardsLabel(source)).toBe(`до ${DEFAULT_CRITERIA_LIMIT} по критериям`);
    });

    it('should use custom limit for criteria mode', () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: {},
        limit: 25,
      };
      expect(scenarioCardsLabel(source)).toBe('до 25 по критериям');
    });
  });

  describe('normalizeScenario', () => {
    function createLegacyScenario(overrides?: Partial<LegacyScenario>): LegacyScenario {
      return {
        id: 'scenario-1',
        title: 'Test Scenario',
        description: 'Test Description',
        authorId: 'author-1',
        published: true,
        updatedAt: '2024-01-01T00:00:00Z',
        languagePair: 'en-zh',
        ...overrides,
      } as LegacyScenario;
    }

    it('should normalize a legacy scenario with cardSource', () => {
      const raw = createLegacyScenario({
        cardSource: { mode: 'fixed', cardIds: ['card-1'] },
      });
      const normalized = normalizeScenario(raw);

      expect(normalized.id).toBe('scenario-1');
      expect(normalized.title).toBe('Test Scenario');
      expect(normalized.cardSource).toEqual({ mode: 'fixed', cardIds: ['card-1'] });
    });

    it('should create default cardSource when absent', () => {
      const raw = createLegacyScenario({ cardIds: ['card-1', 'card-2'] });
      const normalized = normalizeScenario(raw);

      expect(normalized.cardSource).toEqual({
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      });
    });

    it('should handle missing published as false', () => {
      const raw = createLegacyScenario({ published: undefined });
      const normalized = normalizeScenario(raw);

      expect(normalized.published).toBe(false);
    });

    it('should handle missing updatedAt', () => {
      const raw = createLegacyScenario({ updatedAt: undefined });
      const normalized = normalizeScenario(raw);

      expect(normalized.updatedAt).toBeDefined();
    });

    it('should normalize languagePair', () => {
      const raw = createLegacyScenario({
        languagePair: { known: 'en', learning: 'zh' },
      });
      const normalized = normalizeScenario(raw);

      expect(normalized.languagePair).toBeDefined();
    });
  });

  describe('scenarioMatchesLanguagePair', () => {
    it('should return true for matching language pair', () => {
      const scenario: Pick<Scenario, 'languagePair'> = {
        languagePair: { known: 'en', learning: 'zh' },
      };
      const pair: LanguagePair = { known: 'en', learning: 'zh' };
      expect(scenarioMatchesLanguagePair(scenario, pair)).toBe(true);
    });

    it('should return false for non-matching language pair', () => {
      const scenario: Pick<Scenario, 'languagePair'> = {
        languagePair: { known: 'en', learning: 'zh' },
      };
      const pair: LanguagePair = { known: 'ru', learning: 'zh' };
      expect(scenarioMatchesLanguagePair(scenario, pair)).toBe(false);
    });

    it('should return false when scenario has no languagePair', () => {
      const scenario: Pick<Scenario, 'languagePair'> = { languagePair: undefined };
      const pair: LanguagePair = { known: 'en', learning: 'zh' };
      expect(scenarioMatchesLanguagePair(scenario, pair)).toBe(false);
    });
  });

  describe('resolveScenarioCardIds', async () => {
    it('should return cardIds for fixed mode', async () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      };
      const result = await resolveScenarioCardIds(source, {} as CardSearchService);
      expect(result).toEqual(['card-1', 'card-2']);
    });

    it('should return cardIds for snapshot mode', async () => {
      const source: ScenarioCardSource = {
        mode: 'snapshot',
        cardIds: ['card-3'],
        criteria: {},
        frozenAt: '2024-01-01T00:00:00Z',
      };
      const result = await resolveScenarioCardIds(source, {} as unknown as CardSearchService);
      expect(result).toEqual(['card-3']);
    });

    it('should search and return ids for criteria mode', async () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: { kinds: ['select'] },
        limit: 10,
      };
      const mockService = {
        search: vi.fn().mockResolvedValue({
          items: [
            { id: 'card-a', title: '', kind: 'select', knownLanguage: 'en', learningLanguage: 'zh', tags: [], ipaReadings: [], difficulty: 'beginner', updatedAt: '2024-01-01' },
            { id: 'card-b', title: '', kind: 'select', knownLanguage: 'en', learningLanguage: 'zh', tags: [], ipaReadings: [], difficulty: 'beginner', updatedAt: '2024-01-02' },
          ],
        }),
      };
      const result = await resolveScenarioCardIds(source, mockService as unknown as CardSearchService);
      expect(result).toEqual(['card-b', 'card-a']);
      expect(mockService.search).toHaveBeenCalledWith({
        kinds: ['select'],
        page: { page: 0, pageSize: 10 },
      });
    });
  });

  describe('sortCardIndexEntries', () => {
    const entries: CardIndexEntry[] = [
      {
        id: 'a',
        title: 'A',
        updatedAt: '2024-01-03',
        difficulty: 'beginner',
        kind: 'select',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
      },
      {
        id: 'b',
        title: 'B',
        updatedAt: '2024-01-01',
        difficulty: 'advanced',
        kind: 'memory',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
      },
      {
        id: 'c',
        title: 'C',
        updatedAt: '2024-01-02',
        difficulty: 'intermediate',
        kind: 'select',
        knownLanguage: 'en',
        learningLanguage: 'zh',
        tags: [],
        ipaReadings: [],
      },
    ];

    it('should sort by updatedAt descending', () => {
      const result = sortCardIndexEntries(entries, 'updatedAt');
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('c');
      expect(result[2].id).toBe('b');
    });

    it('should sort by difficulty', () => {
      const result = sortCardIndexEntries(entries, 'difficulty');
      expect(result[0].difficulty).toBe('beginner');
      expect(result[1].difficulty).toBe('intermediate');
      expect(result[2].difficulty).toBe('advanced');
    });

    it('should shuffle when sort is random', () => {
      const result = sortCardIndexEntries(entries, 'random', 'seed-1');
      expect(result.length).toBe(3);
      expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    });

    it('should return new array without mutating original', () => {
      const result = sortCardIndexEntries(entries, 'updatedAt');
      expect(result).not.toBe(entries);
    });
  });

  describe('validateScenarioCardSource', async () => {
    it('should return error for empty cardIds in fixed mode', async () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: [],
      };
      const result = await validateScenarioCardSource(source, vi.fn());
      expect(result).toEqual({
        field: 'cardSource',
        message: 'Выберите хотя бы одну карточку',
      });
    });

    it('should return error when card not found', async () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1'],
      };
      const cardExists = vi.fn().mockResolvedValue(false);
      const result = await validateScenarioCardSource(source, cardExists);
      expect(result).toEqual({
        field: 'cardSource',
        message: 'Карточка не найдена: card-1',
      });
    });

    it('should return null when all cards exist', async () => {
      const source: ScenarioCardSource = {
        mode: 'fixed',
        cardIds: ['card-1', 'card-2'],
      };
      const cardExists = vi.fn().mockResolvedValue(true);
      const result = await validateScenarioCardSource(source, cardExists);
      expect(result).toBeNull();
    });

    it('should return error for criteria mode without filters', async () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: {},
      };
      const result = await validateScenarioCardSource(source, vi.fn());
      expect(result).toEqual({
        field: 'cardSource',
        message: 'Укажите хотя бы один критерий отбора карточек',
      });
    });

    it('should return error for zero limit', async () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: { query: 'test' },
        limit: 0,
      };
      const result = await validateScenarioCardSource(source, vi.fn());
      expect(result).toEqual({
        field: 'cardSource',
        message: 'Лимит карточек должен быть больше 0',
      });
    });

    it('should return null for valid criteria source', async () => {
      const source: ScenarioCardSource = {
        mode: 'criteria',
        criteria: { query: 'test' },
        limit: 20,
      };
      const result = await validateScenarioCardSource(source, vi.fn());
      expect(result).toBeNull();
    });
  });

  describe('buildSnapshotCardSource', () => {
    it('should create a snapshot source', () => {
      const source = buildSnapshotCardSource(['card-1', 'card-2'], { query: 'test' }, 25);
      expect(source.mode).toBe('snapshot');
      expect(source.cardIds).toEqual(['card-1', 'card-2']);
      expect(source.criteria).toEqual({ query: 'test' });
      expect(source.limit).toBe(25);
      expect(source.frozenAt).toBeDefined();
    });

    it('should work without limit', () => {
      const source = buildSnapshotCardSource(['card-1'], {});
      expect(source.mode).toBe('snapshot');
      expect(source.limit).toBeUndefined();
    });
  });
});
