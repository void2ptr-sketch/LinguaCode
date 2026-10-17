import {
  inferTonesFromPinyin,
  isToneColorSchemeId,
  resolveToneColorPalette,
  resolveToneColorScheme,
  segmentHanText,
  segmentPinyinText,
  segmentToneText,
  toneColorForMark,
} from './tone-color.utils';

describe('tone-color.utils', () => {
  describe('isToneColorSchemeId', () => {
    it('should return true for valid scheme id', () => {
      expect(isToneColorSchemeId('classic')).toBe(true);
    });

    it('should return false for invalid scheme id', () => {
      expect(isToneColorSchemeId('invalid')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isToneColorSchemeId(123)).toBe(false);
      expect(isToneColorSchemeId(null)).toBe(false);
      expect(isToneColorSchemeId(undefined)).toBe(false);
    });
  });

  describe('resolveToneColorScheme', () => {
    it('should return classic scheme for classic id', () => {
      const scheme = resolveToneColorScheme('classic');
      expect(scheme.id).toBe('classic');
    });

    it('should return default scheme for undefined id', () => {
      const scheme = resolveToneColorScheme(undefined);
      expect(scheme.id).toBeDefined();
    });

    it('should return default scheme for null id', () => {
      const scheme = resolveToneColorScheme(null);
      expect(scheme.id).toBeDefined();
    });

    it('should return default scheme for unknown id', () => {
      const scheme = resolveToneColorScheme('unknown' as never);
      expect(scheme.id).toBeDefined();
    });
  });

  describe('resolveToneColorPalette', () => {
    it('should resolve classic palette colors', () => {
      const palette = resolveToneColorPalette('classic');
      expect(palette[1]).toBe('#ff0000');
      expect(palette[2]).toBe('#ffa500');
      expect(palette[3]).toBe('#008000');
      expect(palette[4]).toBe('#0000ff');
      expect(palette[5]).toBe('#000000');
    });

    it('should resolve default palette for undefined', () => {
      const palette = resolveToneColorPalette(undefined);
      expect(palette[1]).toBeDefined();
    });
  });

  describe('toneColorForMark', () => {
    it('should return color for tone mark', () => {
      const palette = resolveToneColorPalette('classic');
      expect(toneColorForMark(palette, 1)).toBe('#ff0000');
      expect(toneColorForMark(palette, 2)).toBe('#ffa500');
      expect(toneColorForMark(palette, 3)).toBe('#008000');
      expect(toneColorForMark(palette, 4)).toBe('#0000ff');
      expect(toneColorForMark(palette, 5)).toBe('#000000');
    });
  });

  describe('inferTonesFromPinyin', () => {
    it('should return empty array for count <= 0', () => {
      expect(inferTonesFromPinyin('hǎo', 0)).toEqual([]);
      expect(inferTonesFromPinyin('hǎo', -1)).toEqual([]);
    });

    it('should return tone 5 for empty pinyin', () => {
      const tones = inferTonesFromPinyin('', 3);
      expect(tones).toEqual([5, 5, 5]);
    });

    it('should return tone 5 for whitespace pinyin', () => {
      const tones = inferTonesFromPinyin('   ', 2);
      expect(tones).toEqual([5, 5]);
    });

    it('should infer tones for multi-char words', () => {
      expect(inferTonesFromPinyin('hěn bàng', 2)).toEqual([3, 4]);
    });

    it('should infer single tone', () => {
      expect(inferTonesFromPinyin('nǐ', 1)).toEqual([3]);
    });

    it('should handle more syllables than count', () => {
      expect(inferTonesFromPinyin('nǐ hǎo hěn', 2)).toEqual([3, 3]);
    });

    it('should handle fewer syllables than count', () => {
      const tones = inferTonesFromPinyin('nǐ', 3);
      expect(tones).toEqual([3, 5, 5]);
    });

    it('should use tone 5 for missing syllables', () => {
      const tones = inferTonesFromPinyin('nǐ   hǎo', 4);
      expect(tones).toEqual([3, 3, 5, 5]);
    });
  });

  describe('segmentHanText', () => {
    it('should segment han characters using pinyin tones', () => {
      expect(segmentHanText('你好', 'nǐ hǎo')).toEqual([
        { text: '你', tone: 3 },
        { text: '好', tone: 3 },
      ]);
    });

    it('should return empty array for empty primary', () => {
      expect(segmentHanText('')).toEqual([]);
      expect(segmentHanText('  ')).toEqual([]);
    });

    it('should use provided tones when length matches', () => {
      expect(segmentHanText('你好', undefined, [1, 2])).toEqual([
        { text: '你', tone: 1 },
        { text: '好', tone: 2 },
      ]);
    });

    it('should infer tones from pinyin when tones not provided', () => {
      expect(segmentHanText('你', 'nǐ')).toEqual([{ text: '你', tone: 3 }]);
    });

    it('should use tone 5 for missing characters', () => {
      expect(segmentHanText('你好啊', 'nǐ hǎo')).toEqual([
        { text: '你', tone: 3 },
        { text: '好', tone: 3 },
        { text: '啊', tone: 5 },
      ]);
    });
  });

  describe('segmentPinyinText', () => {
    it('should segment pinyin syllables with tones', () => {
      expect(segmentPinyinText('nǐ hǎo')).toEqual([
        { text: 'nǐ', tone: 3 },
        { text: ' ', tone: 5 },
        { text: 'hǎo', tone: 3 },
      ]);
    });

    it('should return empty array for empty input', () => {
      expect(segmentPinyinText('')).toEqual([]);
      expect(segmentPinyinText('  ')).toEqual([]);
    });

    it('should handle single syllable', () => {
      expect(segmentPinyinText('nǐ')).toEqual([{ text: 'nǐ', tone: 3 }]);
    });
  });

  describe('segmentToneText', () => {
    it('should use fixedTone when provided', () => {
      const result = segmentToneText('你好', 'han', { fixedTone: 1 });
      expect(result).toEqual([{ text: '你好', tone: 1 }]);
    });

    it('should delegate to segmentHanText for han mode', () => {
      const result = segmentToneText('你好', 'han', { pinyin: 'nǐ hǎo' });
      expect(result).toEqual([
        { text: '你', tone: 3 },
        { text: '好', tone: 3 },
      ]);
    });

    it('should delegate to segmentPinyinText for pinyin mode', () => {
      const result = segmentToneText('nǐ hǎo', 'pinyin');
      expect(result).toEqual([
        { text: 'nǐ', tone: 3 },
        { text: ' ', tone: 5 },
        { text: 'hǎo', tone: 3 },
      ]);
    });

    it('should use fixedTone even in pinyin mode', () => {
      const result = segmentToneText('nǐ hǎo', 'pinyin', { fixedTone: 2 });
      expect(result).toEqual([{ text: 'nǐ hǎo', tone: 2 }]);
    });
  });
});
