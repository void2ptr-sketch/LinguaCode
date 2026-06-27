import {
  applyToneToLastVowelInSyllable,
  applyToneToPinyinSyllable,
  applyToneMarkToVowel,
  normalizeToneOptions,
  toneMarkLabel,
} from './tone-mark.utils';

describe('tone-mark.utils', () => {
  it('should apply tone marks to pinyin syllable', () => {
    expect(applyToneToPinyinSyllable('ma', 1)).toBe('mā');
    expect(applyToneToPinyinSyllable('ma', 3)).toBe('mǎ');
    expect(applyToneToPinyinSyllable('ma', 5)).toBe('ma');
    expect(applyToneToPinyinSyllable('lv', 2)).toBe('lǘ');
  });

  it('should apply tone marks to the last vowel in a syllable', () => {
    expect(applyToneToLastVowelInSyllable('hao', 3)).toBe('haǒ');
    expect(applyToneToLastVowelInSyllable('oioi', 4)).toBe('oioì');
    expect(applyToneToLastVowelInSyllable('ni', 3)).toBe('nǐ');
  });

  it('should tone-mark a single vowel for keyboard previews', () => {
    expect(applyToneMarkToVowel('i', 4)).toBe('ì');
    expect(applyToneMarkToVowel('o', 3)).toBe('ǒ');
  });

  it('should normalize tone option lists', () => {
    expect(normalizeToneOptions([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    expect(normalizeToneOptions([4, 2, 4, 1])).toEqual([1, 2, 4]);
    expect(normalizeToneOptions([1])).toBeNull();
  });

  it('should provide russian tone labels', () => {
    expect(toneMarkLabel(1)).toBe('1-й тон');
    expect(toneMarkLabel(5)).toBe('лёгкий');
  });
});
