import { PINYIN_SYLLABLE_IPA, convertPinyinToIpa } from './ipa-mapping';

describe('IPA mapping', () => {
  describe('PINYIN_SYLLABLE_IPA', () => {
    it('should contain known syllable mappings', () => {
      expect(PINYIN_SYLLABLE_IPA['guo']).toBe('kuɔ');
      expect(PINYIN_SYLLABLE_IPA['hao']).toBe('xaʊ');
      expect(PINYIN_SYLLABLE_IPA['ma']).toBe('ma');
      expect(PINYIN_SYLLABLE_IPA['ni']).toBe('ni');
      expect(PINYIN_SYLLABLE_IPA['xie']).toBe('ɕjɛ');
      expect(PINYIN_SYLLABLE_IPA['zhong']).toBe('ʈʂʊŋ');
    });

    it('should have exactly 6 entries', () => {
      expect(Object.keys(PINYIN_SYLLABLE_IPA).length).toBe(6);
    });
  });

  describe('convertPinyinToIpa', () => {
    it('should convert syllable with base mapping and tone', () => {
      const parse = (raw: string) => {
        const base = raw.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (char) => {
          const map: Record<string, string> = {
            ā: 'a', á: 'a', ǎ: 'a', à: 'a',
            ē: 'e', é: 'e', ě: 'e', è: 'e',
            ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
            ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
            ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
            ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v',
          };
          return map[char] || char;
        });
        const toneMap: Record<string, number> = {
          ā: 1, á: 2, ǎ: 3, à: 4,
          ē: 1, é: 2, ě: 3, è: 4,
          ī: 1, í: 2, ǐ: 3, ì: 4,
          ō: 1, ó: 2, ǒ: 3, ò: 4,
          ū: 1, ú: 2, ǔ: 3, ù: 4,
          ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
        };
        let tone = 5;
        for (const char of raw) {
          if (toneMap[char] !== undefined) {
            tone = toneMap[char];
          }
        }
        return { base, tone };
      };

      expect(convertPinyinToIpa('mā', parse)).toBe('ma˥');
      expect(convertPinyinToIpa('má', parse)).toBe('ma˧˥');
      expect(convertPinyinToIpa('mǎ', parse)).toBe('ma˨˩˦');
      expect(convertPinyinToIpa('mà', parse)).toBe('ma˥˩');
    });

    it('should return base syllable when mapping is not found', () => {
      const parse = (raw: string) => ({ base: raw, tone: 5 });
      expect(convertPinyinToIpa('xyz', parse)).toBe('xyz');
    });

    it('should return empty string for empty base', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const parse = (_raw: string) => ({ base: '', tone: 5 });
      expect(convertPinyinToIpa('', parse)).toBe('');
    });
  });
});
