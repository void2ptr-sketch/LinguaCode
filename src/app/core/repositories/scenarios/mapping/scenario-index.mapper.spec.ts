import { scenarioToIndexEntry, sortScenariosByUpdatedAt } from './scenario-index.mapper';
import type { Scenario } from '../../../models';

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: 's1',
    title: 'Test Scenario',
    description: 'Description',
    authorId: 'local-user',
    cardSource: { mode: 'cards' },
    published: true,
    updatedAt: '2026-10-10T12:00:00.000Z',
    languagePair: { known: 'ru', learning: 'zh' },
    ...overrides,
  } as Scenario;
}

describe('scenario-index.mapper', () => {
  describe('scenarioToIndexEntry', () => {
    it('should map scenario to index entry with correct values', () => {
      const scenario = makeScenario();
      const entry = scenarioToIndexEntry(scenario);

      expect(entry.id).toBe('s1');
      expect(entry.title).toBe('Test Scenario');
      expect(entry.authorId).toBe('local-user');
      expect(entry.cardSourceMode).toBe('cards');
      expect(entry.published).toBe(true);
      expect(entry.updatedAt).toBe('2026-10-10T12:00:00.000Z');
      expect(entry.languagePairSummary).toBeTruthy();
      expect(typeof entry.languagePairSummary).toBe('string');
      expect(entry.courseId).toBeUndefined();
    });

    it('should include courseId when present', () => {
      const scenario = makeScenario({ courseId: 'course-1' });
      const entry = scenarioToIndexEntry(scenario);
      expect(entry.courseId).toBe('course-1');
    });

    it('should omit languagePairSummary when languagePair is absent', () => {
      const scenario = makeScenario({ languagePair: undefined });
      const entry = scenarioToIndexEntry(scenario);
      expect(entry.languagePairSummary).toBeUndefined();
    });

    it('should include cardSourceSummary', () => {
      const scenario = makeScenario();
      const entry = scenarioToIndexEntry(scenario);
      expect(entry.cardSourceSummary).toBeTruthy();
    });
  });

  describe('sortScenariosByUpdatedAt', () => {
    it('should sort entries by updatedAt descending', () => {
      const entries = [
        scenarioToIndexEntry(makeScenario({ updatedAt: '2026-01-01T00:00:00.000Z' })),
        scenarioToIndexEntry(makeScenario({ updatedAt: '2026-10-10T00:00:00.000Z' })),
        scenarioToIndexEntry(makeScenario({ updatedAt: '2026-06-15T00:00:00.000Z' })),
      ];

      const sorted = sortScenariosByUpdatedAt(entries);

      expect(sorted[0].updatedAt).toBe('2026-10-10T00:00:00.000Z');
      expect(sorted[1].updatedAt).toBe('2026-06-15T00:00:00.000Z');
      expect(sorted[2].updatedAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should not mutate the original array', () => {
      const entries = [
        scenarioToIndexEntry(makeScenario({ updatedAt: '2026-01-01T00:00:00.000Z' })),
        scenarioToIndexEntry(makeScenario({ updatedAt: '2026-10-10T00:00:00.000Z' })),
      ];
      const originalFirst = entries[0].updatedAt;

      sortScenariosByUpdatedAt(entries);

      expect(entries[0].updatedAt).toBe(originalFirst);
    });

    it('should return empty array for empty input', () => {
      expect(sortScenariosByUpdatedAt([])).toEqual([]);
    });

    it('should return single element unchanged', () => {
      const entries = [scenarioToIndexEntry(makeScenario())];
      const sorted = sortScenariosByUpdatedAt(entries);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('s1');
    });
  });
});
