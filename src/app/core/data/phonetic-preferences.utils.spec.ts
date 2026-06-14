import {
  isRomanizationDisplayEnabled,
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  shouldShowPalladius,
} from './phonetic-preferences.utils';

describe('phonetic-preferences.utils', () => {
  it('should default cjk learning preferences', () => {
    const prefs = normalizeCjkLearningPreferences();

    expect(prefs.displayRomanizations).toEqual(['pinyin']);
    expect(prefs.answerRomanization).toContain('palladius');
  });

  it('should migrate legacy displayRomanization into displayRomanizations', () => {
    const prefs = normalizeCjkLearningPreferences({ displayRomanization: 'palladius' });

    expect(prefs.displayRomanizations).toEqual(['palladius']);
  });

  it('should preserve displayRomanizations order', () => {
    const prefs = normalizeCjkLearningPreferences({
      displayRomanizations: ['palladius', 'pinyin', 'zhuyin'],
    });

    expect(prefs.displayRomanizations).toEqual(['pinyin', 'zhuyin', 'palladius']);
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

  it('should check enabled romanization systems', () => {
    const prefs = normalizeCjkLearningPreferences({
      displayRomanizations: ['pinyin', 'zhuyin'],
    });

    expect(isRomanizationDisplayEnabled(prefs, 'pinyin')).toBeTrue();
    expect(isRomanizationDisplayEnabled(prefs, 'palladius')).toBeFalse();
  });
});
