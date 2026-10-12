import { parsePinyinSyllable, pinyinSyllableToIpa, pinyinToIpa } from './pinyin-to-ipa.utils';

describe('pinyin-to-ipa.utils', () => {
  it('should parse tone marks from vowels', () => {
    expect(parsePinyinSyllable('nǐ')).toEqual({ base: 'ni', tone: 3 });
    expect(parsePinyinSyllable('hao3')).toEqual({ base: 'hao', tone: 3 });
  });

  it('should convert syllables with chao tone contours', () => {
    expect(pinyinSyllableToIpa('nǐ')).toBe('ni˨˩˦');
    expect(pinyinSyllableToIpa('hǎo')).toBe('xaʊ˨˩˦');
    expect(pinyinSyllableToIpa('zhōng')).toBe('ʈʂʊŋ˥');
  });

  it('should join multi-syllable pinyin', () => {
    expect(pinyinToIpa('nǐ hǎo')).toBe('ni˨˩˦ xaʊ˨˩˦');
    expect(pinyinToIpa('zhōng guó')).toBe('ʈʂʊŋ˥ kuɔ˧˥');
  });
});
