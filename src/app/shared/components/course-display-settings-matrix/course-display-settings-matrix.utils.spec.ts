import {
  normalizeAnswerModesForSave,
  normalizeRomanizationsForSave,
  toggleAnswerModes,
  toggleRomanizations,
} from './course-display-settings-matrix.utils';

describe('course-display-settings-matrix.utils', () => {
  describe('toggleRomanizations', () => {
    it('adds a system in display order', () => {
      expect(toggleRomanizations(['pinyin'], 'palladius', true)).toEqual(['pinyin', 'palladius']);
    });

    it('keeps palladius only when disabling pinyin', () => {
      expect(toggleRomanizations(['pinyin', 'palladius'], 'pinyin', false)).toEqual(['palladius']);
    });

    it('keeps pinyin only when disabling palladius', () => {
      expect(toggleRomanizations(['pinyin', 'palladius'], 'palladius', false)).toEqual(['pinyin']);
    });

    it('allows disabling the last system', () => {
      expect(toggleRomanizations(['pinyin'], 'pinyin', false)).toEqual([]);
    });

    it('toggles pinyin and palladius independently', () => {
      let current = toggleRomanizations(['pinyin', 'palladius'], 'pinyin', false);
      expect(current).toEqual(['palladius']);

      current = toggleRomanizations(current, 'palladius', false);
      expect(current).toEqual([]);

      current = toggleRomanizations(current, 'pinyin', true);
      expect(current).toEqual(['pinyin']);
    });
  });

  describe('normalizeRomanizationsForSave', () => {
    it('preserves empty draft', () => {
      expect(normalizeRomanizationsForSave([])).toEqual([]);
    });
  });

  describe('toggleAnswerModes', () => {
    it('adds ipa to answer modes', () => {
      expect(toggleAnswerModes(['orthography'], 'ipa', true)).toEqual(['orthography', 'ipa']);
    });

    it('allows disabling the last answer mode in draft', () => {
      expect(toggleAnswerModes(['orthography'], 'orthography', false)).toEqual([]);
    });
  });

  describe('normalizeAnswerModesForSave', () => {
    it('preserves empty draft', () => {
      expect(normalizeAnswerModesForSave([])).toEqual([]);
    });
  });
});
