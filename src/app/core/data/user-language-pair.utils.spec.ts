import {
  createDefaultLanguagePairPreferences,
  createUserLanguagePairEntry,
  normalizeUserPreferences,
} from './user-language-pair.utils';

describe('user-language-pair.utils', () => {
  it('should migrate legacy languagePair field', () => {
    const preferences = normalizeUserPreferences({
      theme: 'azure-blue',
      fontSize: 'md',
      languagePair: { known: 'ru', learning: 'zh' },
    });

    expect(preferences.languagePairs).toHaveSize(1);
    expect(preferences.languagePairs[0].pair).toEqual({ known: 'ru', learning: 'zh' });
    expect(preferences.activeLanguagePairId).toBe(preferences.languagePairs[0].id);
  });

  it('should dedupe language pair entries', () => {
    const first = createUserLanguagePairEntry({ known: 'ru', learning: 'en' }, 'pair-1');
    const duplicate = createUserLanguagePairEntry({ known: 'ru', learning: 'en' }, 'pair-2');

    const preferences = normalizeUserPreferences({
      theme: 'azure-blue',
      fontSize: 'md',
      languagePairs: [first, duplicate],
      activeLanguagePairId: 'pair-2',
    });

    expect(preferences.languagePairs).toHaveSize(1);
    expect(preferences.activeLanguagePairId).toBe(preferences.languagePairs[0].id);
  });

  it('should create default language pair preferences', () => {
    const defaults = createDefaultLanguagePairPreferences();

    expect(defaults.languagePairs).toHaveSize(1);
    expect(defaults.activeLanguagePairId).toBe(defaults.languagePairs[0].id);
  });
});
