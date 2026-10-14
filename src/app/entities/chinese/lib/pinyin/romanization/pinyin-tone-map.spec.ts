import { PINYIN_TONE_MAP } from './pinyin-tone-map';

describe('PINYIN_TONE_MAP', () => {
  it('should have exactly 25 entries (6 vowels × 4 tones)', () => {
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
