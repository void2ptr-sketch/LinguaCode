import {
  DEFAULT_ANSWER_ROMANIZATIONS,
  DEFAULT_DISPLAY_ROMANIZATIONS,
  isOnlyAnswerModeEnabled,
  isOnlyRomanizationEnabled,
  toggleAnswerModes,
  toggleRomanizations,
} from './course-display-settings-matrix.utils';

describe('course-display-settings-matrix.utils', () => {
  describe('toggleRomanizations', () => {
    it('adds a system in display order', () => {
      expect(toggleRomanizations(['pinyin'], 'palladius', true, DEFAULT_DISPLAY_ROMANIZATIONS)).toEqual([
        'pinyin',
        'palladius',
      ]);
    });

    it('removes a system when disabled', () => {
      expect(
        toggleRomanizations(['pinyin', 'palladius'], 'palladius', false, DEFAULT_DISPLAY_ROMANIZATIONS),
      ).toEqual(['pinyin']);
    });

    it('falls back when disabling the last system', () => {
      expect(toggleRomanizations(['pinyin'], 'pinyin', false, DEFAULT_DISPLAY_ROMANIZATIONS)).toEqual([
        ...DEFAULT_DISPLAY_ROMANIZATIONS,
      ]);
    });
  });

  describe('isOnlyRomanizationEnabled', () => {
    it('returns true for the sole enabled system', () => {
      expect(isOnlyRomanizationEnabled(['pinyin'], 'pinyin')).toBeTrue();
    });

    it('returns false when multiple systems are enabled', () => {
      expect(isOnlyRomanizationEnabled(['pinyin', 'zhuyin'], 'pinyin')).toBeFalse();
    });
  });

  describe('toggleAnswerModes', () => {
    it('adds ipa to answer modes', () => {
      expect(toggleAnswerModes(['orthography'], 'ipa', true)).toEqual(['orthography', 'ipa']);
    });

    it('falls back when disabling the last answer mode', () => {
      expect(toggleAnswerModes(['orthography'], 'orthography', false)).toEqual(['orthography']);
    });
  });

  describe('isOnlyAnswerModeEnabled', () => {
    it('returns true for the sole enabled mode', () => {
      expect(isOnlyAnswerModeEnabled(['ipa'], 'ipa')).toBeTrue();
    });
  });
});
