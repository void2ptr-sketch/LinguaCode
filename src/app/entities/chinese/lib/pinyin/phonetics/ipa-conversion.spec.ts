import { parsePinyinSyllable, pinyinSyllableToIpa, pinyinToIpa } from './ipa-conversion';

describe('parsePinyinSyllable', () => {
  it('should parse base syllable with default tone 5', () => {
    const result = parsePinyinSyllable('ma');
    expect(result.base).toBe('ma');
    expect(result.tone).toBe(5);
  });

  it('should parse syllable with tone mark', () => {
    const result = parsePinyinSyllable('mā');
    expect(result.base).toBe('ma');
    expect(result.tone).toBe(1);
  });

  it('should parse syllable with numeric tone suffix', () => {
    const result = parsePinyinSyllable('ma1');
    expect(result.base).toBe('ma');
    expect(result.tone).toBe(1);

    const result3 = parsePinyinSyllable('ni3');
    expect(result3.base).toBe('ni');
    expect(result3.tone).toBe(3);

    const result5 = parsePinyinSyllable('ba5');
    expect(result5.base).toBe('ba');
    expect(result5.tone).toBe(5);
  });

  it('should handle all four tones', () => {
    expect(parsePinyinSyllable('mā').tone).toBe(1);
    expect(parsePinyinSyllable('má').tone).toBe(2);
    expect(parsePinyinSyllable('mǎ').tone).toBe(3);
    expect(parsePinyinSyllable('mà').tone).toBe(4);
  });

  it('should handle ü via v with tones', () => {
    const result = parsePinyinSyllable('lǘ');
    expect(result.base).toBe('lv');
    expect(result.tone).toBe(2);
  });

  it('should handle empty and whitespace input', () => {
    const empty = parsePinyinSyllable('');
    expect(empty.base).toBe('');
    expect(empty.tone).toBe(5);

    const space = parsePinyinSyllable('  ');
    expect(space.base).toBe('');
    expect(space.tone).toBe(5);
  });

  it('should be case insensitive', () => {
    expect(parsePinyinSyllable('MA').base).toBe('ma');
    expect(parsePinyinSyllable('Ma').base).toBe('ma');
  });
});

describe('pinyinSyllableToIpa', () => {
  it('should convert known syllables to IPA', () => {
    expect(pinyinSyllableToIpa('hao')).toBe('xaʊ');
    expect(pinyinSyllableToIpa('ma')).toBe('ma');
    expect(pinyinSyllableToIpa('ni')).toBe('ni');
    expect(pinyinSyllableToIpa('guo')).toBe('kuɔ');
    expect(pinyinSyllableToIpa('xie')).toBe('ɕjɛ');
    expect(pinyinSyllableToIpa('zhong')).toBe('ʈʂʊŋ');
  });

  it('should append Chao tone contour for known syllables', () => {
    // Tone 1: ˥
    expect(pinyinSyllableToIpa('mā')).toBe('ma˥');
    // Tone 2: ˧˥
    expect(pinyinSyllableToIpa('má')).toBe('ma˧˥');
    // Tone 3: ˨˩˦
    expect(pinyinSyllableToIpa('mǎ')).toBe('ma˨˩˦');
    // Tone 4: ˥˩
    expect(pinyinSyllableToIpa('mà')).toBe('ma˥˩');
    // Tone 5 (neutral): no contour
    expect(pinyinSyllableToIpa('ma')).toBe('ma');
  });

  it('should return base syllable when IPA mapping is not found', () => {
    expect(pinyinSyllableToIpa('xyz')).toBe('xyz');
  });

  it('should return empty string for empty input', () => {
    expect(pinyinSyllableToIpa('')).toBe('');
  });
});

describe('pinyinToIpa', () => {
  it('should convert multi-syllable pinyin to IPA', () => {
    expect(pinyinToIpa('ni hao')).toBe('ni xaʊ');
    expect(pinyinToIpa('ma ma')).toBe('ma ma');
  });

  it('should handle tones in multi-syllable input', () => {
    expect(pinyinToIpa('nǐ hǎo')).toBe('ni˨˩˦ xaʊ˨˩˦');
  });

  it('should handle multiple spaces between syllables', () => {
    expect(pinyinToIpa('ni   hao')).toBe('ni xaʊ');
  });

  it('should handle empty input', () => {
    expect(pinyinToIpa('')).toBe('');
    expect(pinyinToIpa('  ')).toBe('');
  });

  it('should trim input', () => {
    expect(pinyinToIpa('  ni hao  ')).toBe('ni xaʊ');
  });
});
