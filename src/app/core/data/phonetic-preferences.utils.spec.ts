import {
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  shouldShowPalladius,
} from './phonetic-preferences.utils';

describe('phonetic-preferences.utils', () => {
  it('should default cjk learning preferences', () => {
    const prefs = normalizeCjkLearningPreferences();

    expect(prefs.displayRomanization).toBe('pinyin');
    expect(prefs.answerRomanization).toContain('palladius');
  });

  it('should normalize phonetic preferences', () => {
    const prefs = normalizePhoneticPreferences({ showIpa: true, ipaVariantLabel: 'BrE' });

    expect(prefs.showIpa).toBeTrue();
    expect(prefs.ipaVariantLabel).toBe('BrE');
  });

  it('should show palladius only for ru to zh pair', () => {
    expect(shouldShowPalladius('ru', 'zh')).toBeTrue();
    expect(shouldShowPalladius('ru', 'en')).toBeFalse();
    expect(shouldShowPalladius('en', 'zh')).toBeFalse();
  });
});
