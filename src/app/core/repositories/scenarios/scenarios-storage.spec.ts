import type { Scenario } from '../../models';
import {
  resetContentSeedCache,
  setScenarioSeedCache,
} from '../content-seed/content-seed.cache';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../user/user-content-overlay.storage';
import {
  loadScenariosFromStorage,
  readStoredScenarios,
  saveScenariosToStorage,
} from './scenarios-storage';

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: 'scenario-1',
    title: 'Scenario 1',
    description: 'Test scenario',
    authorId: 'local-user',
    cardSource: { mode: 'cards' },
    published: false,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Scenario;
}

describe('scenarios-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetContentSeedCache();
    setScenarioSeedCache([makeScenario()]);
  });

  describe('readStoredScenarios', () => {
    it('should return null when no user modifications exist', () => {
      expect(readStoredScenarios()).toBeNull();
    });

    it('should return resolved scenarios when overlay has modifications', () => {
      saveScenariosToStorage([makeScenario({ title: 'Changed' })]);

      const result = readStoredScenarios();

      expect(result).not.toBeNull();
      expect(result?.map((scenario) => scenario.title)).toContain('Changed');
    });

    it('should return a copy (mutations do not affect stored data)', () => {
      saveScenariosToStorage([makeScenario({ title: 'Changed' })]);

      const first = readStoredScenarios();
      const second = readStoredScenarios();

      expect(first).not.toBe(second);
    });
  });

  describe('loadScenariosFromStorage', () => {
    it('should return seed scenarios when overlay is empty', () => {
      expect(loadScenariosFromStorage()).toEqual([makeScenario()]);
    });

    it('should apply stored patches over the seed', () => {
      saveScenariosToStorage([makeScenario({ title: 'Changed' })]);

      const result = loadScenariosFromStorage();

      expect(result.find((scenario) => scenario.id === 'scenario-1')?.title).toBe('Changed');
    });

    it('should exclude scenarios deleted by the user', () => {
      saveScenariosToStorage([]);

      const result = loadScenariosFromStorage();

      expect(result.find((scenario) => scenario.id === 'scenario-1')).toBeUndefined();
    });
  });

  describe('saveScenariosToStorage', () => {
    it('should store nothing when saved scenarios match the seed', () => {
      saveScenariosToStorage([makeScenario()]);

      const overlay = readUserContentOverlay();

      expect(Object.keys(overlay.scenarios)).toHaveLength(0);
      expect(overlay.deletedSystemIds?.scenarios ?? []).toHaveLength(0);
    });

    it('should capture a title change as a patch', () => {
      saveScenariosToStorage([makeScenario({ title: 'Changed' })]);

      const overlay = readUserContentOverlay();

      expect(overlay.scenarios['scenario-1']).toMatchObject({ title: 'Changed' });
    });

    it('should track deleted seed scenarios in deletedSystemIds', () => {
      saveScenariosToStorage([]);

      const overlay = readUserContentOverlay();

      expect(overlay.deletedSystemIds?.scenarios).toContain('scenario-1');
    });

    it('should preserve unrelated overlay collections', () => {
      patchUserContentOverlay({
        cardIndexMeta: { 'card-1': { knownLanguage: 'ru' } },
      });

      saveScenariosToStorage([makeScenario({ title: 'Changed' })]);

      const overlay = readUserContentOverlay();
      expect(overlay.cardIndexMeta['card-1']).toEqual({ knownLanguage: 'ru' });
    });
  });
});
