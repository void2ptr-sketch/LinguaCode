import {
  CHAO_TONE_CONTOURS,
  PINYIN_SYLLABLE_IPA,
  PINYIN_SYLLABLE_IPA_COVERAGE,
} from './ipa-mapping';

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

describe('PINYIN_SYLLABLE_IPA_COVERAGE', () => {
  it('should report the known entry count matching the dictionary', () => {
    expect(PINYIN_SYLLABLE_IPA_COVERAGE.known).toBe(Object.keys(PINYIN_SYLLABLE_IPA).length);
    expect(PINYIN_SYLLABLE_IPA_COVERAGE.known).toBe(6);
  });

  it('should report the total Mandarin syllable inventory', () => {
    expect(PINYIN_SYLLABLE_IPA_COVERAGE.total).toBe(413);
  });
});

describe('CHAO_TONE_CONTOURS', () => {
  it('should map all tones 1–5', () => {
    expect(CHAO_TONE_CONTOURS[1]).toBe('˥');
    expect(CHAO_TONE_CONTOURS[2]).toBe('˧˥');
    expect(CHAO_TONE_CONTOURS[3]).toBe('˨˩˦');
    expect(CHAO_TONE_CONTOURS[4]).toBe('˥˩');
    expect(CHAO_TONE_CONTOURS[5]).toBe('');
  });
});
