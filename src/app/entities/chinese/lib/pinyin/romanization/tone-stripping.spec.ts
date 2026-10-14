import { stripPinyinTones } from './tone-stripping';

describe('stripPinyinTones', () => {
  it('should remove tone marks from pinyin string', () => {
    expect(stripPinyinTones('nǐ hǎo')).toBe('ni hao');
    expect(stripPinyinTones('māma')).toBe('mama');
    expect(stripPinyinTones('zhōngguó')).toBe('zhongguo');
  });

  it('should convert ü to v', () => {
    expect(stripPinyinTones('lǘ')).toBe('lv');
    expect(stripPinyinTones('lü')).toBe('lv');
    expect(stripPinyinTones('yǚ')).toBe('yv');
  });

  it('should handle already base form without tones', () => {
    expect(stripPinyinTones('ni hao')).toBe('ni hao');
    expect(stripPinyinTones('zhong guo')).toBe('zhong guo');
  });

  it('should handle numeric tone suffixes (pass through)', () => {
    // Numeric tones are not stripped — only diacritic marks
    expect(stripPinyinTones('ni3 hao3')).toBe('ni3 hao3');
  });

  it('should lowercase the result', () => {
    expect(stripPinyinTones('NǏ HǍO')).toBe('ni hao');
    expect(stripPinyinTones('ZHONGGUO')).toBe('zhongguo');
  });

  it('should handle empty string', () => {
    expect(stripPinyinTones('')).toBe('');
  });

  it('should handle ü in various contexts', () => {
    expect(stripPinyinTones('nü')).toBe('nv');
    expect(stripPinyinTones('lüe')).toBe('lve');
    expect(stripPinyinTones('jue')).toBe('jue');
  });

  it('should handle all toned vowels', () => {
    const tonedVariants: Record<string, string[]> = {
      a: ['ā', 'á', 'ǎ', 'à'],
      e: ['ē', 'é', 'ě', 'è'],
      i: ['ī', 'í', 'ǐ', 'ì'],
      o: ['ō', 'ó', 'ǒ', 'ò'],
      u: ['ū', 'ú', 'ǔ', 'ù'],
      v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
    };

    for (const [base, variants] of Object.entries(tonedVariants)) {
      for (const toned of variants) {
        const result = stripPinyinTones(toned);
        expect(result).toBe(base);
      }
    }
  });

  it('should handle mixed toned and untoned characters', () => {
    expect(stripPinyinTones('māma')).toBe('mama');
    expect(stripPinyinTones('Nǐhǎo')).toBe('nihao');
    expect(stripPinyinTones('zhōng wén')).toBe('zhong wen');
  });

  it('should handle NFD normalization edge cases', () => {
    // Composed forms
    expect(stripPinyinTones('\u0101')).toBe('a'); // ā
    expect(stripPinyinTones('\u00e1')).toBe('a'); // á
    expect(stripPinyinTones('\u01ce')).toBe('a'); // ǎ
    expect(stripPinyinTones('\u00e0')).toBe('a'); // à

    // ü forms
    expect(stripPinyinTones('\u01d6')).toBe('v'); // ǖ
    expect(stripPinyinTones('\u01d8')).toBe('v'); // ǘ
    expect(stripPinyinTones('\u01da')).toBe('v'); // ǚ
    expect(stripPinyinTones('\u01dc')).toBe('v'); // ǜ
  });
});
