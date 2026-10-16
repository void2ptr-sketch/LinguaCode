import {
  VOWEL_TONE_MARKS,
  TONE_MARK_TO_BASE,
  PINYIN_TONE_MAP,
  toneFromMarkedVowel,
} from './vowel-tone-maps';

describe('vowel-tone-maps', () => {
  describe('VOWEL_TONE_MARKS', () => {
    it('should contain all 4 tones for each base vowel', () => {
      const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'] as const;

      for (const vowel of vowels) {
        expect(Object.keys(VOWEL_TONE_MARKS[vowel])).toHaveLength(4);
      }
    });

    it('should map tone 1 correctly', () => {
      const v = VOWEL_TONE_MARKS;
      expect(v['a'][1]).toBe('\u0101'); // ā
      expect(v['e'][1]).toBe('\u0113'); // ē
      expect(v['i'][1]).toBe('\u012b'); // ī
      expect(v['o'][1]).toBe('\u014d'); // ō
      expect(v['u'][1]).toBe('\u016b'); // ū
      expect(v['ü'][1]).toBe('\u01d6'); // ǖ
    });

    it('should map tone 2 correctly', () => {
      const v = VOWEL_TONE_MARKS;
      expect(v['a'][2]).toBe('\u00e1'); // á
      expect(v['e'][2]).toBe('\u00e9'); // é
      expect(v['i'][2]).toBe('\u00ed'); // í
      expect(v['o'][2]).toBe('\u00f3'); // ó
      expect(v['u'][2]).toBe('\u00fa'); // ú
      expect(v['ü'][2]).toBe('\u01d8'); // ǘ
    });

    it('should map tone 3 correctly', () => {
      const v = VOWEL_TONE_MARKS;
      expect(v['a'][3]).toBe('\u01ce'); // ǎ
      expect(v['e'][3]).toBe('\u011b'); // ě
      expect(v['i'][3]).toBe('\u01d0'); // ǐ
      expect(v['o'][3]).toBe('\u01d2'); // ǒ
      expect(v['u'][3]).toBe('\u01d4'); // ǔ
      expect(v['ü'][3]).toBe('\u01da'); // ǚ
    });

    it('should map tone 4 correctly', () => {
      const v = VOWEL_TONE_MARKS;
      expect(v['a'][4]).toBe('\u00e0'); // à
      expect(v['e'][4]).toBe('\u00e8'); // è
      expect(v['i'][4]).toBe('\u00ec'); // ì
      expect(v['o'][4]).toBe('\u00f2'); // ò
      expect(v['u'][4]).toBe('\u00f9'); // ù
      expect(v['ü'][4]).toBe('\u01dc'); // ǜ
    });
  });

  describe('TONE_MARK_TO_BASE', () => {
    it('should map all toned vowels to base forms', () => {
      // a tones
      expect(TONE_MARK_TO_BASE['\u0101']).toBe('a'); // ā
      expect(TONE_MARK_TO_BASE['\u00e1']).toBe('a'); // á
      expect(TONE_MARK_TO_BASE['\u01ce']).toBe('a'); // ǎ
      expect(TONE_MARK_TO_BASE['\u00e0']).toBe('a'); // à

      // ü tones
      expect(TONE_MARK_TO_BASE['\u01d6']).toBe('v'); // ǖ
      expect(TONE_MARK_TO_BASE['\u01d8']).toBe('v'); // ǘ
      expect(TONE_MARK_TO_BASE['\u01da']).toBe('v'); // ǚ
      expect(TONE_MARK_TO_BASE['\u01dc']).toBe('v'); // ǜ
    });

    it('should return undefined for non-toned characters', () => {
      expect(TONE_MARK_TO_BASE['a']).toBeUndefined();
      expect(TONE_MARK_TO_BASE['b']).toBeUndefined();
      expect(TONE_MARK_TO_BASE['n']).toBeUndefined();
    });
  });

  describe('toneFromMarkedVowel', () => {
    it('should return correct tone for each vowel', () => {
      expect(toneFromMarkedVowel('\u0101')).toBe(1); // ā
      expect(toneFromMarkedVowel('\u00e1')).toBe(2); // á
      expect(toneFromMarkedVowel('\u01ce')).toBe(3); // ǎ
      expect(toneFromMarkedVowel('\u00e0')).toBe(4); // à

      expect(toneFromMarkedVowel('\u0113')).toBe(1); // ē
      expect(toneFromMarkedVowel('\u00e9')).toBe(2); // é
      expect(toneFromMarkedVowel('\u011b')).toBe(3); // ě
      expect(toneFromMarkedVowel('\u00e8')).toBe(4); // è
    });

    it('should return null for non-toned characters', () => {
      expect(toneFromMarkedVowel('a')).toBeNull();
      expect(toneFromMarkedVowel('n')).toBeNull();
      expect(toneFromMarkedVowel(' ')).toBeNull();
    });
  });

  describe('PINYIN_TONE_MAP', () => {
    it('should have exactly 25 entries (6 vowels × 4 tones + plain ü)', () => {
      expect(Object.keys(PINYIN_TONE_MAP).length).toBe(25);
    });

    it('should map all 4 tones for each base vowel a, e, i, o, u', () => {
      const baseVowels = ['a', 'e', 'i', 'o', 'u'];

      for (const vowel of baseVowels) {
        const tonedChars = Object.entries(PINYIN_TONE_MAP)
          .filter(([, base]) => base === vowel)
          .map(([char]) => char);

        expect(tonedChars.length).toBe(4);
      }
    });

    it('should map ü variants to v', () => {
      expect(PINYIN_TONE_MAP['\u01d6']).toBe('v'); // ǖ
      expect(PINYIN_TONE_MAP['\u01d8']).toBe('v'); // ǘ
      expect(PINYIN_TONE_MAP['\u01da']).toBe('v'); // ǚ
      expect(PINYIN_TONE_MAP['\u01dc']).toBe('v'); // ǜ
      expect(PINYIN_TONE_MAP['\u00fc']).toBe('v'); // ü
    });

    it('should map all base vowels to themselves', () => {
      const baseVowels = ['a', 'e', 'i', 'o', 'u', 'v'];

      for (const vowel of baseVowels) {
        const entries = Object.entries(PINYIN_TONE_MAP).filter(([, base]) => base === vowel);
        expect(entries.length).toBe(vowel === 'v' ? 5 : 4);
      }
    });
  });

  describe('map consistency', () => {
    it('should keep TONE_MARK_TO_BASE and PINYIN_TONE_MAP in sync', () => {
      for (const [mark, base] of Object.entries(TONE_MARK_TO_BASE)) {
        expect(PINYIN_TONE_MAP[mark]).toBe(base);
      }
    });

    it('should round-trip VOWEL_TONE_MARKS ↔ TONE_MARK_TO_BASE ↔ toneFromMarkedVowel', () => {
      for (const [vowel, marks] of Object.entries(VOWEL_TONE_MARKS)) {
        for (const [tone, mark] of Object.entries(marks)) {
          const expectedBase = vowel === 'ü' ? 'v' : vowel;
          expect(TONE_MARK_TO_BASE[mark]).toBe(expectedBase);
          expect(toneFromMarkedVowel(mark)).toBe(Number(tone));
        }
      }
    });
  });
});
