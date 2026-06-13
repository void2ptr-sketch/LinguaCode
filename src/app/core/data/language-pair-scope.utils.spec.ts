import type { ScenarioIndexEntry } from '../models/scenario-index.types';
import {
  activeLanguagePairCriteria,
  scenarioIndexMatchesLanguageCriteria,
  scenarioIndexMatchesLanguagePair,
} from './language-pair-scope.utils';

const entry: ScenarioIndexEntry = {
  id: 's1',
  title: 'Demo',
  authorId: 'local-user',
  cardSourceMode: 'fixed',
  cardSourceSummary: '1 карточек',
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePairSummary: 'Русский → English',
};

describe('language-pair-scope.utils', () => {
  it('should build active pair criteria', () => {
    expect(activeLanguagePairCriteria({ known: 'ru', learning: 'en' })).toEqual({
      knownLanguage: 'ru',
      learningLanguage: 'en',
    });
  });

  it('should match scenario index entry to language pair', () => {
    expect(scenarioIndexMatchesLanguagePair(entry, { known: 'ru', learning: 'en' })).toBe(true);
    expect(scenarioIndexMatchesLanguagePair(entry, { known: 'ru', learning: 'zh' })).toBe(false);
  });

  it('should skip filter when language criteria are omitted', () => {
    expect(scenarioIndexMatchesLanguageCriteria(entry)).toBe(true);
  });
});
