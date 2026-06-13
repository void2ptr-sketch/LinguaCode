import type { ScenarioIndexEntry } from '../models/scenario-index.types';
import { matchesScenarioIndexEntry } from './scenario-search.utils';

const baseEntry: ScenarioIndexEntry = {
  id: 's1',
  title: 'Demo scenario',
  authorId: 'local-user',
  cardSourceMode: 'fixed',
  cardSourceSummary: '1 карточек',
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePairSummary: 'Русский → English',
};

describe('scenario-search.utils', () => {
  it('should match entry by active language pair criteria', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
      'other-user',
    );

    expect(matches).toBe(true);
  });

  it('should hide entry when language pair criteria mismatch', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'zh' },
      'other-user',
    );

    expect(matches).toBe(false);
  });

  it('should hide legacy entries without languagePairSummary in strict pair filter', () => {
    const legacyEntry: ScenarioIndexEntry = { ...baseEntry, languagePairSummary: undefined };

    const matches = matchesScenarioIndexEntry(
      legacyEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
      'other-user',
    );

    expect(matches).toBe(false);
  });
});
