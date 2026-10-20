import { describe, expect, it } from 'vitest';
import {
  findLastVowelIndex,
  applyToneMarkToVowel,
  applyToneToPinyinSyllable,
  applyToneToLastVowelInSyllable,
  PINYIN_VOWELS,
} from './apply-tone';

describe('apply-tone', () => {
  // ── PINYIN_VOWELS ──

  describe('PINYIN_VOWELS', () => {
    it('should contain all pinyin vowels', () => {
      expect(PINYIN_VOWELS.has('a')).toBe(true);
      expect(PINYIN_VOWELS.has('e')).toBe(true);
      expect(PINYIN_VOWELS.has('i')).toBe(true);
      expect(PINYIN_VOWELS.has('o')).toBe(true);
      expect(PINYIN_VOWELS.has('u')).toBe(true);
      expect(PINYIN_VOWELS.has('v')).toBe(true);
    });

    it('should not contain consonants', () => {
      expect(PINYIN_VOWELS.has('b')).toBe(false);
      expect(PINYIN_VOWELS.has('n')).toBe(false);
      expect(PINYIN_VOWELS.has('z')).toBe(false);
    });
  });

  // ── findLastVowelIndex ──

  describe('findLastVowelIndex', () => {
    it('should find last vowel in simple syllable', () => {
      const result = findLastVowelIndex('hao');
      expect(result).not.toBeNull();
      expect(result!.vowelKey).toBe('o');
    });

    it('should find last vowel in complex syllable', () => {
      const result = findLastVowelIndex('zhong');
      expect(result).not.toBeNull();
      expect(result!.vowelKey).toBe('o');
    });

    it('should return null for no vowels', () => {
      expect(findLastVowelIndex('')).toBeNull();
      expect(findLastVowelIndex('r')).toBeNull();
    });

    it('should find v as vowel (ü)', () => {
      const result = findLastVowelIndex('nv');
      expect(result).not.toBeNull();
      expect(result!.vowelKey).toBe('ü');
    });

    it('should find last vowel when multiple exist', () => {
      const result = findLastVowelIndex('ai');
      expect(result).not.toBeNull();
      expect(result!.vowelKey).toBe('i');
    });
  });

  // ── applyToneMarkToVowel ──

  describe('applyToneMarkToVowel', () => {
    it('should apply tone 1 to a', () => {
      expect(applyToneMarkToVowel('a', 1)).toBe('\u0101'); // ā
    });

    it('should apply tone 2 to e', () => {
      expect(applyToneMarkToVowel('e', 2)).toBe('\u00e9'); // é
    });

    it('should apply tone 3 to i', () => {
      expect(applyToneMarkToVowel('i', 3)).toBe('\u01d0'); // ǐ
    });

    it('should apply tone 4 to o', () => {
      expect(applyToneMarkToVowel('o', 4)).toBe('\u00f2'); // ò
    });

    it('should return unmarked vowel for tone 5', () => {
      expect(applyToneMarkToVowel('a', 5)).toBe('a');
      expect(applyToneMarkToVowel('ü', 5)).toBe('ü');
    });

    it('should handle ü with tone 1', () => {
      expect(applyToneMarkToVowel('ü', 1)).toBe('\u01d6'); // ǖ
    });

    it('should return original vowel for unknown tone', () => {
      expect(applyToneMarkToVowel('a', 99 as never)).toBe('a');
    });
  });

  // ── applyToneToPinyinSyllable ──

  describe('applyToneToPinyinSyllable', () => {
    it('should apply tone to a priority', () => {
      expect(applyToneToPinyinSyllable('ma', 2)).toBe('má');
    });

    it('should apply tone to e when no a', () => {
      expect(applyToneToPinyinSyllable('he', 2)).toBe('hé');
    });

    it('should apply tone to o in ou', () => {
      expect(applyToneToPinyinSyllable('ou', 2)).toBe('óu');
    });

    it('should apply tone to last vowel', () => {
      expect(applyToneToPinyinSyllable('ni', 2)).toBe('ní');
      expect(applyToneToPinyinSyllable('bu', 2)).toBe('bú');
    });

    it('should return empty for empty base', () => {
      expect(applyToneToPinyinSyllable('', 1)).toBe('');
    });

    it('should return display base for tone 5', () => {
      expect(applyToneToPinyinSyllable('ma', 5)).toBe('ma');
    });

    it('should handle ü (v in internal)', () => {
      // v maps to ü, tone 2 on ü → ǘ (last vowel rule)
      expect(applyToneToPinyinSyllable('nv', 2)).toBe('nǘ');
    });

    it('should lowercase uppercase input', () => {
      expect(applyToneToPinyinSyllable('MA', 2)).toBe('má');
    });

    it('should handle no vowels gracefully', () => {
      expect(applyToneToPinyinSyllable('r', 1)).toBe('r');
    });

    it('should lowercase uppercase input', () => {
      expect(applyToneToPinyinSyllable('MA', 2)).toBe('má');
    });

    it('should handle complex syllable zhong', () => {
      expect(applyToneToPinyinSyllable('zhong', 2)).toBe('zhóng');
    });

    it('should handle complex syllable zhong', () => {
      expect(applyToneToPinyinSyllable('zhong', 2)).toBe('zhóng');
    });
  });

  // ── applyToneToLastVowelInSyllable ──

  describe('applyToneToLastVowelInSyllable', () => {
    it('should apply tone to last vowel', () => {
      expect(applyToneToLastVowelInSyllable('mao', 2)).toBe('maó');
    });

    it('should return empty for empty base', () => {
      expect(applyToneToLastVowelInSyllable('', 1)).toBe('');
    });

    it('should return display base for tone 5', () => {
      expect(applyToneToLastVowelInSyllable('mao', 5)).toBe('mao');
    });

    it('should return display base when no vowels', () => {
      expect(applyToneToLastVowelInSyllable('r', 1)).toBe('r');
    });

    it('should handle ü (v in internal)', () => {
      expect(applyToneToLastVowelInSyllable('nv', 2)).toBe('nǘ');
    });

    it('should handle complex syllable zhong', () => {
      expect(applyToneToLastVowelInSyllable('zhong', 2)).toBe('zhóng');
    });

    it('should handle single vowel', () => {
      expect(applyToneToLastVowelInSyllable('a', 2)).toBe('á');
    });
  });
});
