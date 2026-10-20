import { describe, expect, it } from 'vitest';
import { stripPinyinTones } from './tone-stripping';

describe('tone-stripping', () => {
  describe('stripPinyinTones', () => {
    it('should strip tone marks from pinyin', () => {
      expect(stripPinyinTones('nǐ hǎo')).toBe('ni hao');
    });

    it('should handle tone 1 marks', () => {
      expect(stripPinyinTones('māma')).toBe('mama');
    });

    it('should handle tone 2 marks', () => {
      expect(stripPinyinTones('bába')).toBe('baba');
    });

    it('should handle tone 3 marks', () => {
      expect(stripPinyinTones('hěnhǎo')).toBe('henhao');
    });

    it('should handle tone 4 marks', () => {
      expect(stripPinyinTones('shuìjiao')).toBe('shuijiao');
    });

    it('should convert ü to v', () => {
      expect(stripPinyinTones('nǚ')).toBe('nv');
      expect(stripPinyinTones('lǜ')).toBe('lv');
    });

    it('should handle plain ASCII without tones', () => {
      expect(stripPinyinTones('nihao')).toBe('nihao');
    });

    it('should handle empty string', () => {
      expect(stripPinyinTones('')).toBe('');
    });

    it('should lowercase the result', () => {
      expect(stripPinyinTones('NǏ')).toBe('ni');
    });

    it('should handle mixed tones', () => {
      expect(stripPinyinTones('Zhōngwén hěn yǒuqù')).toBe('zhongwen hen youqu');
    });

    it('should handle ü with tone marks', () => {
      expect(stripPinyinTones('ǚ')).toBe('v');
      expect(stripPinyinTones('ǜ')).toBe('v');
    });

    it('should handle ü plain form', () => {
      expect(stripPinyinTones('ü')).toBe('v');
    });

    it('should preserve non-pinyin characters', () => {
      expect(stripPinyinTones('ni1 hao2')).toBe('ni1 hao2');
    });

    it('should handle spaces', () => {
      expect(stripPinyinTones('nǐ hǎo')).toBe('ni hao');
    });

    it('should handle single character', () => {
      expect(stripPinyinTones('ā')).toBe('a');
      expect(stripPinyinTones('á')).toBe('a');
      expect(stripPinyinTones('ǎ')).toBe('a');
      expect(stripPinyinTones('à')).toBe('a');
    });
  });
});
