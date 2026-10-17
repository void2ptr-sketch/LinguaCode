import { describe, expect, it } from 'vitest';
import {
  VOWEL_TONE_MARKS,
  TONE_MARK_TO_BASE,
  toneFromMarkedVowel,
  PINYIN_TONE_MAP,
} from './vowel-tone-maps';

describe('vowel-tone-maps', () => {
  // ── VOWEL_TONE_MARKS ──

  describe('VOWEL_TONE_MARKS', () => {
    it('should have marks for all vowels', () => {
      ['a', 'e', 'i', 'o', 'u', 'ü'].forEach((vowel) => {
        expect(VOWEL_TONE_MARKS[vowel]).toBeDefined();
        expect(Object.keys(VOWEL_TONE_MARKS[vowel])).toHaveLength(4);
      });
    });

    it('should have correct tone 1 marks', () => {
      expect(VOWEL_TONE_MARKS['a'][1]).toBe('\u0101'); // ā
      expect(VOWEL_TONE_MARKS['e'][1]).toBe('\u0113'); // ē
      expect(VOWEL_TONE_MARKS['i'][1]).toBe('\u012b'); // ī
    });

    it('should have correct tone 2 marks', () => {
      expect(VOWEL_TONE_MARKS['a'][2]).toBe('\u00e1'); // á
      expect(VOWEL_TONE_MARKS['e'][2]).toBe('\u00e9'); // é
    });

    it('should have correct tone 3 marks', () => {
      expect(VOWEL_TONE_MARKS['a'][3]).toBe('\u01ce'); // ǎ
      expect(VOWEL_TONE_MARKS['e'][3]).toBe('\u011b'); // ě
    });

    it('should have correct tone 4 marks', () => {
      expect(VOWEL_TONE_MARKS['a'][4]).toBe('\u00e0'); // à
      expect(VOWEL_TONE_MARKS['e'][4]).toBe('\u00e8'); // è
    });

    it('should have correct ü tone marks', () => {
      expect(VOWEL_TONE_MARKS['ü'][1]).toBe('\u01d6'); // ǖ
      expect(VOWEL_TONE_MARKS['ü'][2]).toBe('\u01d8'); // ǘ
      expect(VOWEL_TONE_MARKS['ü'][3]).toBe('\u01da'); // ǚ
      expect(VOWEL_TONE_MARKS['ü'][4]).toBe('\u01dc'); // ǜ
    });
  });

  // ── TONE_MARK_TO_BASE ──

  describe('TONE_MARK_TO_BASE', () => {
    it('should map tone marks to base vowels', () => {
      expect(TONE_MARK_TO_BASE['\u00e1']).toBe('a'); // á → a
      expect(TONE_MARK_TO_BASE['\u00e9']).toBe('e'); // é → e
      expect(TONE_MARK_TO_BASE['\u00ed']).toBe('i'); // í → i
      expect(TONE_MARK_TO_BASE['\u00f3']).toBe('o'); // ó → o
      expect(TONE_MARK_TO_BASE['\u00fa']).toBe('u'); // ú → u
    });

    it('should map ü tone marks to v', () => {
      expect(TONE_MARK_TO_BASE['\u01d6']).toBe('v'); // ǖ → v
      expect(TONE_MARK_TO_BASE['\u01d8']).toBe('v'); // ǘ → v
      expect(TONE_MARK_TO_BASE['\u01da']).toBe('v'); // ǚ → v
      expect(TONE_MARK_TO_BASE['\u01dc']).toBe('v'); // ǜ → v
    });

    it('should map non-tone characters to undefined', () => {
      expect(TONE_MARK_TO_BASE['a']).toBeUndefined();
      expect(TONE_MARK_TO_BASE['z']).toBeUndefined();
      expect(TONE_MARK_TO_BASE['1']).toBeUndefined();
    });
  });

  // ── toneFromMarkedVowel ──

  describe('toneFromMarkedVowel', () => {
    it('should return tone 1 for tone 1 marks', () => {
      expect(toneFromMarkedVowel('\u0101')).toBe(1); // ā
      expect(toneFromMarkedVowel('\u0113')).toBe(1); // ē
    });

    it('should return tone 2 for tone 2 marks', () => {
      expect(toneFromMarkedVowel('\u00e1')).toBe(2); // á
      expect(toneFromMarkedVowel('\u00e9')).toBe(2); // é
    });

    it('should return tone 3 for tone 3 marks', () => {
      expect(toneFromMarkedVowel('\u01ce')).toBe(3); // ǎ
      expect(toneFromMarkedVowel('\u011b')).toBe(3); // ě
    });

    it('should return tone 4 for tone 4 marks', () => {
      expect(toneFromMarkedVowel('\u00e0')).toBe(4); // à
      expect(toneFromMarkedVowel('\u00e8')).toBe(4); // è
    });

    it('should return null for non-tone characters', () => {
      expect(toneFromMarkedVowel('a')).toBeNull();
      expect(toneFromMarkedVowel('z')).toBeNull();
      expect(toneFromMarkedVowel('1')).toBeNull();
      expect(toneFromMarkedVowel('')).toBeNull();
    });
  });

  // ── PINYIN_TONE_MAP ──

  describe('PINYIN_TONE_MAP', () => {
    it('should map tone marks to base vowels', () => {
      expect(PINYIN_TONE_MAP['\u00e1']).toBe('a'); // á → a
      expect(PINYIN_TONE_MAP['\u00e9']).toBe('e'); // é → e
    });

    it('should map ü to v', () => {
      expect(PINYIN_TONE_MAP['\u00fc']).toBe('v'); // ü → v
    });

    it('should map non-tone characters to undefined', () => {
      expect(PINYIN_TONE_MAP['a']).toBeUndefined();
    });
  });
});
