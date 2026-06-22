import {
  inferTonesFromPinyin,
  resolveToneColorPalette,
  segmentHanText,
  segmentPinyinText,
} from './tone-color.utils';

describe('tone-color.utils', () => {
  it('should segment pinyin syllables with tones', () => {
    expect(segmentPinyinText('nǐ hǎo')).toEqual([
      { text: 'nǐ', tone: 3 },
      { text: ' ', tone: 5 },
      { text: 'hǎo', tone: 3 },
    ]);
  });

  it('should segment han characters using pinyin tones', () => {
    expect(segmentHanText('你好', 'nǐ hǎo')).toEqual([
      { text: '你', tone: 3 },
      { text: '好', tone: 3 },
    ]);
  });

  it('should infer tones for multi-char words', () => {
    expect(inferTonesFromPinyin('hěn bàng', 2)).toEqual([3, 4]);
  });

  it('should resolve classic palette colors', () => {
    const palette = resolveToneColorPalette('classic');
    expect(palette[1]).toBe('#c62828');
    expect(palette[5]).toBe('#757575');
  });
});
