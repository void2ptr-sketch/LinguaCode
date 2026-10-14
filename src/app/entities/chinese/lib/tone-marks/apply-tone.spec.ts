import {
  applyToneMarkToVowel,
  applyToneToPinyinSyllable,
  applyToneToLastVowelInSyllable,
} from './apply-tone';

describe('applyToneMarkToVowel', () => {
  it('should apply tone marks to base vowels', () => {
    expect(applyToneMarkToVowel('a', 1)).toBe('\u0101'); // ā
    expect(applyToneMarkToVowel('a', 2)).toBe('\u00e1'); // á
    expect(applyToneMarkToVowel('a', 3)).toBe('\u01ce'); // ǎ
    expect(applyToneMarkToVowel('a', 4)).toBe('\u00e0'); // à
  });

  it('should handle ü via v', () => {
    expect(applyToneMarkToVowel('v', 1)).toBe('\u01d6'); // ǖ
    expect(applyToneMarkToVowel('v', 2)).toBe('\u01d8'); // ǘ
    expect(applyToneMarkToVowel('v', 3)).toBe('\u01da'); // ǚ
    expect(applyToneMarkToVowel('v', 4)).toBe('\u01dc'); // ǜ
  });

  it('should return unmodified vowel for tone 5 (neutral)', () => {
    expect(applyToneMarkToVowel('a', 5)).toBe('a');
    expect(applyToneMarkToVowel('v', 5)).toBe('\u00fc'); // ü
    expect(applyToneMarkToVowel('ü', 5)).toBe('\u00fc'); // ü
  });

  it('should handle unknown vowels gracefully', () => {
    expect(applyToneMarkToVowel('x', 1)).toBe('x');
  });
});

describe('applyToneToPinyinSyllable', () => {
  it('should apply tone following priority rules: a > e > ou > last', () => {
    // a takes priority
    expect(applyToneToPinyinSyllable('ma', 1)).toBe('m\u0101'); // mā
    expect(applyToneToPinyinSyllable('la', 3)).toBe('l\u01ce'); // lǎ

    // e takes priority when no a
    expect(applyToneToPinyinSyllable('he', 2)).toBe('h\u00e9'); // hé

    // o takes priority in 'ou'
    expect(applyToneToPinyinSyllable('ou', 4)).toBe('\u00f2u'); // òu (o takes priority over u)

    // last vowel for others
    expect(applyToneToPinyinSyllable('ni', 1)).toBe('n\u012b'); // nī
  });

  it('should handle tone 5 (neutral) by returning base form', () => {
    expect(applyToneToPinyinSyllable('ma', 5)).toBe('ma');
    expect(applyToneToPinyinSyllable('hao', 5)).toBe('hao');
  });

  it('should handle empty input', () => {
    expect(applyToneToPinyinSyllable('', 1)).toBe('');
  });

  it('should handle ü via v', () => {
    expect(applyToneToPinyinSyllable('lv', 2)).toBe('l\u01d8'); // lǘ
  });
});

describe('applyToneToLastVowelInSyllable', () => {
  it('should apply tone to the last vowel in the syllable', () => {
    // Last vowel in 'hao' is 'o' (не a — это applyToneToPinyinSyllable)
    expect(applyToneToLastVowelInSyllable('hao', 3)).toBe('ha\u01d2'); // haǒ
    expect(applyToneToLastVowelInSyllable('hao', 1)).toBe('ha\u014d'); // haō

    // Last vowel in 'ni' is 'i'
    expect(applyToneToLastVowelInSyllable('ni', 4)).toBe('n\u00ec'); // nì
  });

  it('should handle single vowel syllables', () => {
    expect(applyToneToLastVowelInSyllable('a', 1)).toBe('\u0101'); // ā
    expect(applyToneToLastVowelInSyllable('e', 2)).toBe('\u00e9'); // é
  });

  it('should handle tone 5 (neutral)', () => {
    expect(applyToneToLastVowelInSyllable('ma', 5)).toBe('ma');
  });

  it('should handle empty input', () => {
    expect(applyToneToLastVowelInSyllable('', 1)).toBe('');
  });
});
