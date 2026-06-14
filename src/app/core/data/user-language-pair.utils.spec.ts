import {
  createDefaultLanguagePairPreferences,
  createUserLanguagePairEntry,
  defaultSettingsForPair,
  normalizeUserPreferences,
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
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
    expect(preferences.languagePairs[0].settings?.cjkLearning).toBeDefined();
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
    expect(defaults.languagePairs[0].settings?.phonetic).toBeDefined();
  });

  it('should create pair-specific default settings', () => {
    expect(defaultSettingsForPair({ known: 'ru', learning: 'en' })?.phonetic).toBeDefined();
    expect(defaultSettingsForPair({ known: 'ru', learning: 'zh' })?.cjkLearning).toBeDefined();
    expect(defaultSettingsForPair({ known: 'ru', learning: 'zh' })?.phonetic).toBeUndefined();
  });

  it('should resolve settings from active pair entry', () => {
    const zhEntry = createUserLanguagePairEntry({ known: 'ru', learning: 'zh' }, 'zh-1');
    zhEntry.settings = {
      cjkLearning: { displayRomanization: 'palladius', answerRomanization: ['palladius'], showTones: false },
    };

    expect(resolveCjkLearningForPair(zhEntry).displayRomanization).toBe('palladius');
    expect(resolvePhoneticForPair(zhEntry).showIpa).toBeFalse();
  });
});
