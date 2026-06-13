import { pinyinSyllableToPalladius, pinyinToPalladius, stripPinyinTones } from './cjk-romanization.utils';

describe('cjk-romanization.utils', () => {
  it('should strip pinyin tone marks', () => {
    expect(stripPinyinTones('nǐ')).toBe('ni');
    expect(stripPinyinTones('guó')).toBe('guo');
  });

  it('should convert syllables to palladius', () => {
    expect(pinyinSyllableToPalladius('zhāng')).toBe('чжан');
    expect(pinyinSyllableToPalladius('guó')).toBe('го');
  });

  it('should convert spaced pinyin phrase to palladius', () => {
    expect(pinyinToPalladius('nǐ hǎo')).toBe('ни хао');
  });
});
