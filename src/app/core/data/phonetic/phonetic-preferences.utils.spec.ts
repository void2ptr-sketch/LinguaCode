import {
  isRomanizationDisplayEnabled,
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  normalizeTracingStrokeDurationSec,
  resolveRomanizationsForSurface,
  resolveShowIpaForSurface,
  shouldShowPalladius,
} from './phonetic-preferences.utils';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from '../../models/phonetic-content.types';

describe('phonetic-preferences.utils', () => {
  it('should default cjk learning preferences', () => {
    const prefs = normalizeCjkLearningPreferences();

    expect(prefs.displayRomanizations).toEqual(['pinyin']);
    expect(prefs.answerRomanization).toContain('palladius');
    expect(prefs.tracingStrokeDurationSec).toBe(1);
  });

  it('should migrate legacy displayRomanization into displayRomanizations', () => {
    const prefs = normalizeCjkLearningPreferences({ displayRomanization: 'palladius' });

    expect(prefs.displayRomanizations).toEqual(['palladius']);
  });

  it('should prefer displayRomanizations array over legacy displayRomanization', () => {
    const prefs = normalizeCjkLearningPreferences({
      displayRomanization: 'pinyin',
      displayRomanizations: ['palladius'],
    });

    expect(prefs.displayRomanizations).toEqual(['palladius']);
  });

  it('should preserve empty displayRomanizations when explicitly saved', () => {
    const prefs = normalizeCjkLearningPreferences({
      displayRomanization: 'pinyin',
      displayRomanizations: [],
    });

    expect(prefs.displayRomanizations).toEqual([]);
  });

  it('should preserve empty answerRomanization when explicitly saved', () => {
    const prefs = normalizeCjkLearningPreferences({
      answerRomanization: [],
    });

    expect(prefs.answerRomanization).toEqual([]);
  });

  it('should preserve displayRomanizations order', () => {
    const prefs = normalizeCjkLearningPreferences({
      displayRomanizations: ['palladius', 'pinyin', 'zhuyin'],
    });

    expect(prefs.displayRomanizations).toEqual(['pinyin', 'zhuyin', 'palladius']);
  });

  it('should clamp tracing stroke duration to 0.1–2.0 seconds', () => {
    expect(normalizeTracingStrokeDurationSec(undefined)).toBe(1);
    expect(normalizeTracingStrokeDurationSec(0.05)).toBe(0.1);
    expect(normalizeTracingStrokeDurationSec(2.5)).toBe(2);
    expect(normalizeTracingStrokeDurationSec(1.23)).toBe(1.2);
  });

  it('should normalize phonetic preferences', () => {
    const prefs = normalizePhoneticPreferences({ showIpa: true, ipaVariantLabel: 'BrE' });

    expect(prefs.showIpa).toBeTrue();
    expect(prefs.ipaVariantLabel).toBe('BrE');
  });

  it('should preserve empty answerModes when explicitly saved', () => {
    const prefs = normalizePhoneticPreferences({ answerModes: [] });

    expect(prefs.answerModes).toEqual([]);
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

  it('should resolve prompt romanizations from displayRomanizations', () => {
    const cjk = {
      ...DEFAULT_CJK_LEARNING_PREFERENCES,
      displayRomanizations: ['pinyin', 'zhuyin'] as const,
      answerRomanization: ['palladius'] as const,
    };
    const phonetic = {
      ...DEFAULT_PHONETIC_PREFERENCES,
      answerModes: ['orthography', 'ipa'] as const,
    };

    expect(resolveRomanizationsForSurface('prompt', cjk, phonetic)).toEqual(['pinyin', 'zhuyin']);
  });

  it('should resolve answer romanizations from answerRomanization when orthography enabled', () => {
    const cjk = {
      ...DEFAULT_CJK_LEARNING_PREFERENCES,
      displayRomanizations: ['pinyin'] as const,
      answerRomanization: ['palladius', 'pinyin'] as const,
    };
    const phonetic = {
      ...DEFAULT_PHONETIC_PREFERENCES,
      answerModes: ['orthography'] as const,
    };

    expect(resolveRomanizationsForSurface('answer', cjk, phonetic)).toEqual([
      'palladius',
      'pinyin',
    ]);
  });

  it('should hide answer romanizations when orthography mode disabled', () => {
    const cjk = {
      ...DEFAULT_CJK_LEARNING_PREFERENCES,
      answerRomanization: ['palladius'] as const,
    };
    const phonetic = {
      ...DEFAULT_PHONETIC_PREFERENCES,
      answerModes: ['ipa'] as const,
    };

    expect(resolveRomanizationsForSurface('answer', cjk, phonetic)).toEqual([]);
  });

  it('should resolve IPA visibility by surface', () => {
    const phonetic = {
      ...DEFAULT_PHONETIC_PREFERENCES,
      showIpa: true,
      answerModes: ['orthography', 'ipa'] as const,
    };

    expect(resolveShowIpaForSurface('prompt', phonetic)).toBeTrue();
    expect(resolveShowIpaForSurface('answer', phonetic)).toBeTrue();
  });

  it('should hide answer IPA when answerModes excludes ipa', () => {
    const phonetic = {
      ...DEFAULT_PHONETIC_PREFERENCES,
      showIpa: true,
      answerModes: ['orthography'] as const,
    };

    expect(resolveShowIpaForSurface('answer', phonetic)).toBeFalse();
  });
});
