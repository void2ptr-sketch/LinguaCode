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
    expect(preferences.cardFocusFullscreen).toBeFalse();
    expect(preferences.learningProficiencyLevel).toBe('beginner');
  });

  it('should normalize learning proficiency level', () => {
    const preferences = normalizeUserPreferences({
      theme: 'azure-blue',
      fontSize: 'md',
      learningProficiencyLevel: 'professional',
    });
    expect(preferences.learningProficiencyLevel).toBe('professional');
  });

  it('should migrate legacy chineseProficiencyLevel field', () => {
    const preferences = normalizeUserPreferences({
      theme: 'azure-blue',
      fontSize: 'md',
      chineseProficiencyLevel: 'advanced',
    });
    expect(preferences.learningProficiencyLevel).toBe('advanced');
  });

  it('should normalize card focus fullscreen preference', () => {
    const enabled = normalizeUserPreferences({
      theme: 'azure-blue',
      fontSize: 'md',
      cardFocusFullscreen: true,
    });
    expect(enabled.cardFocusFullscreen).toBeTrue();
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
    expect(defaultSettingsForPair({ known: 'ru', learning: 'zh' })?.phonetic).toBeDefined();
  });

  it('should resolve settings from active pair entry', () => {
    const zhEntry = createUserLanguagePairEntry({ known: 'ru', learning: 'zh' }, 'zh-1');
    zhEntry.settings = {
      cjkLearning: {
        displayRomanizations: ['palladius'],
        answerRomanization: ['palladius'],
        showTones: false,
        toneColorScheme: 'classic',
      },
      phonetic: { showIpa: true, answerModes: ['orthography'] },
    };

    expect(resolveCjkLearningForPair(zhEntry).displayRomanizations).toEqual(['palladius']);
    expect(resolvePhoneticForPair(zhEntry).showIpa).toBeTrue();
  });
});
