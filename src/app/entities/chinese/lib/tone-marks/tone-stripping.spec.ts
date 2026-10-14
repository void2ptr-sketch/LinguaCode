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

  it('should not strip numeric tones', () => {
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

  it('should strip all tone variants of each base vowel', () => {
    const variants: Record<string, string[]> = {
      a: ['\u0101', '\u00e1', '\u01ce', '\u00e0'], // ā á ǎ à
      e: ['\u0113', '\u00e9', '\u011b', '\u00e8'], // ē é ě è
      i: ['\u012b', '\u00ed', '\u01d0', '\u00ec'], // ī í ǐ ì
      o: ['\u014d', '\u00f3', '\u01d2', '\u00f2'], // ō ó ǒ ò
      u: ['\u016b', '\u00fa', '\u01d4', '\u00f9'], // ū ú ǔ ù
    };

    for (const [base, toned] of Object.entries(variants)) {
      for (const char of toned) {
        const result = stripPinyinTones(char);
        expect(result).toBe(base);
      }
    }
  });

  it('should handle mixed toned and untoned characters', () => {
    expect(stripPinyinTones('māma')).toBe('mama');
    expect(stripPinyinTones('Nǐhǎo')).toBe('nihao');
    expect(stripPinyinTones('zhōng wén')).toBe('zhong wen');
  });

  it('should handle composed and decomposed forms', () => {
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
