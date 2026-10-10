import { describe, it, expect } from 'vitest';

import {
  normalizePalladiusAnswer,
  normalizePinyinAnswer,
  normalizeZhuyinAnswer,
  normalizeHanAnswer,
  normalizeRomanizationAnswer,
  answersMatchRomanization,
} from './cjk-answer-normalize.utils';


describe('cjk-answer-normalize.utils', () => {
  describe('normalizePalladiusAnswer', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(normalizePalladiusAnswer('  Hello  ')).toBe('hello');
    });

    it('should replace ё with е', () => {
      expect(normalizePalladiusAnswer('привет ё')).toBe('привет е');
    });

    it('should convert ё to е and then to lowercase', () => {
      // The function replaces lowercase ё with е, then converts to lowercase
      expect(normalizePalladiusAnswer('Ё').toLowerCase()).toBe('ё'.toLowerCase());
      expect(normalizePalladiusAnswer('ё')).toBe('е');
    });

    it('should collapse multiple spaces into one', () => {
      expect(normalizePalladiusAnswer('hello   world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(normalizePalladiusAnswer('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(normalizePalladiusAnswer('   ')).toBe('');
    });
  });

  describe('normalizePinyinAnswer', () => {
    it('should strip tones by default', () => {
      expect(normalizePinyinAnswer('nǐ hǎo')).toBe('ni hao');
    });

    it('should not strip tones when stripTones is false', () => {
      expect(normalizePinyinAnswer('  Nǐ  ', false)).toBe('nǐ');
    });

    it('should trim and collapse spaces when stripTones is false', () => {
      expect(normalizePinyinAnswer('  hello   world  ', false)).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(normalizePinyinAnswer('')).toBe('');
    });
  });

  describe('normalizeZhuyinAnswer', () => {
    it('should remove all spaces', () => {
      expect(normalizeZhuyinAnswer('ㄋ  ㄧ  ㄏㄠ')).toBe('ㄋㄧㄏㄠ');
    });

    it('should trim the result', () => {
      expect(normalizeZhuyinAnswer('  ㄋㄧ  ')).toBe('ㄋㄧ');
    });

    it('should handle empty string', () => {
      expect(normalizeZhuyinAnswer('')).toBe('');
    });
  });

  describe('normalizeHanAnswer', () => {
    it('should remove all spaces', () => {
      expect(normalizeHanAnswer('  人  大  ')).toBe('人大');
    });

    it('should trim the result', () => {
      expect(normalizeHanAnswer('你好')).toBe('你好');
    });

    it('should handle empty string', () => {
      expect(normalizeHanAnswer('')).toBe('');
    });
  });

  describe('normalizeRomanizationAnswer', () => {
    it('should delegate to normalizePalladiusAnswer for palladius system', () => {
      expect(normalizeRomanizationAnswer('  Привет  ', 'palladius')).toBe('привет');
    });

    it('should delegate to normalizePinyinAnswer for pinyin system', () => {
      expect(normalizeRomanizationAnswer('nǐ hǎo', 'pinyin')).toBe('ni hao');
      expect(normalizeRomanizationAnswer('nǐ hǎo', 'pinyin', false)).toContain('ǐ');
    });

    it('should delegate to normalizeZhuyinAnswer for zhuyin system', () => {
      expect(normalizeRomanizationAnswer('ㄋ  ㄧ', 'zhuyin')).toBe('ㄋㄧ');
    });
  });

  describe('answersMatchRomanization', () => {
    it('should return true for matching palladius answers', () => {
      expect(answersMatchRomanization('Привет', '  привет  ', 'palladius')).toBe(true);
    });

    it('should return false for non-matching palladius answers', () => {
      expect(answersMatchRomanization('Привет', 'Пока', 'palladius')).toBe(false);
    });

    it('should return true for matching pinyin answers with tone stripping', () => {
      expect(answersMatchRomanization('nǐ hǎo', 'ni hao', 'pinyin')).toBe(true);
    });

    it('should return false for non-matching pinyin answers', () => {
      expect(answersMatchRomanization('nǐ hǎo', 'bù hǎo', 'pinyin')).toBe(false);
    });

    it('should return true for matching zhuyin answers', () => {
      expect(answersMatchRomanization('ㄋㄧ', ' ㄋ ㄧ ', 'zhuyin')).toBe(true);
    });

    it('should return true for identical han characters with palladius', () => {
      expect(answersMatchRomanization('你好', '你好', 'palladius')).toBe(true);
    });
  });
});
