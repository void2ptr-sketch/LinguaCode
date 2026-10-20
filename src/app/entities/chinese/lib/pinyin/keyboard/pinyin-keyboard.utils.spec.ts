import { describe, expect, it } from 'vitest';
import {
  PINYIN_TONE_OPTIONS,
  PINYIN_KEYBOARD_LETTER_ROWS,
  PINYIN_KEYBOARD_UTILITY_KEYS,
  createPinyinKeyboardState,
  isPinyinKeyboardVowel,
  lastPendingVowel,
  toneKeyPreview,
  syllableSupportsToneMarking,
  shouldShowPinyinToneRow,
  pendingSyllableTonePreview,
  applyPinyinKeyboardKey,
  pinyinKeyboardKeyLabel,
  pinyinKeyboardKeyAriaLabel,
  pinyinKeyboardToneKeyAriaLabel,
} from './pinyin-keyboard.utils';
// types intentionally unused — functions return concrete types inferred from implementations

describe('pinyin-keyboard.utils', () => {
  // ── PINYIN_TONE_OPTIONS ──

  describe('PINYIN_TONE_OPTIONS', () => {
    it('should have tone options', () => {
      expect(PINYIN_TONE_OPTIONS.length).toBeGreaterThan(0);
    });
  });

  // ── PINYIN_KEYBOARD_LETTER_ROWS ──

  describe('PINYIN_KEYBOARD_LETTER_ROWS', () => {
    it('should have 3 rows', () => {
      expect(PINYIN_KEYBOARD_LETTER_ROWS.length).toBe(3);
    });

    it('should have letters in first row', () => {
      expect(PINYIN_KEYBOARD_LETTER_ROWS[0][0]).toEqual({ kind: 'letter', char: 'q' });
    });

    it('should have v with ü label in third row', () => {
      const first = PINYIN_KEYBOARD_LETTER_ROWS[2][0];
      expect(first.kind).toBe('letter');
      if (first.kind === 'letter') {
        expect(first.char).toBe('v');
        expect(first.label).toBe('ü');
      }
    });
  });

  // ── PINYIN_KEYBOARD_UTILITY_KEYS ──

  describe('PINYIN_KEYBOARD_UTILITY_KEYS', () => {
    it('should have space and backspace', () => {
      expect(PINYIN_KEYBOARD_UTILITY_KEYS.length).toBe(2);
      expect(PINYIN_KEYBOARD_UTILITY_KEYS[0].kind).toBe('space');
      expect(PINYIN_KEYBOARD_UTILITY_KEYS[1].kind).toBe('backspace');
    });
  });

  // ── createPinyinKeyboardState ──

  describe('createPinyinKeyboardState', () => {
    it('should create state with empty value', () => {
      const state = createPinyinKeyboardState();
      expect(state.value).toBe('');
      expect(state.toneRowOpen).toBe(false);
    });

    it('should create state with given value', () => {
      const state = createPinyinKeyboardState('ni');
      expect(state.value).toBe('ni');
      expect(state.toneRowOpen).toBe(false);
    });
  });

  // ── isPinyinKeyboardVowel ──

  describe('isPinyinKeyboardVowel', () => {
    it('should identify vowels', () => {
      expect(isPinyinKeyboardVowel('a')).toBe(true);
      expect(isPinyinKeyboardVowel('e')).toBe(true);
      expect(isPinyinKeyboardVowel('i')).toBe(true);
      expect(isPinyinKeyboardVowel('o')).toBe(true);
      expect(isPinyinKeyboardVowel('u')).toBe(true);
      expect(isPinyinKeyboardVowel('v')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isPinyinKeyboardVowel('A')).toBe(true);
      expect(isPinyinKeyboardVowel('E')).toBe(true);
    });

    it('should reject consonants', () => {
      expect(isPinyinKeyboardVowel('b')).toBe(false);
      expect(isPinyinKeyboardVowel('n')).toBe(false);
      expect(isPinyinKeyboardVowel('z')).toBe(false);
    });
  });

  // ── lastPendingVowel ──

  describe('lastPendingVowel', () => {
    it('should return last vowel', () => {
      expect(lastPendingVowel('hao')).toBe('o');
      expect(lastPendingVowel('ni')).toBe('i');
    });

    it('should return empty for no vowels', () => {
      expect(lastPendingVowel('')).toBe('');
      expect(lastPendingVowel('r')).toBe('');
    });
  });

  // ── toneKeyPreview ──

  describe('toneKeyPreview', () => {
    it('should return toned vowel for tone 1', () => {
      const result = toneKeyPreview(1);
      expect(result).toBe('\u0101'); // ā
    });

    it('should return toned vowel for tone 2', () => {
      const result = toneKeyPreview(2);
      expect(result).toBe('\u00e1'); // á
    });

    it('should return unmarked vowel for tone 5', () => {
      const result = toneKeyPreview(5);
      expect(result).toBe('a');
    });

    it('should use custom syllable', () => {
      const result = toneKeyPreview(1, 'ni');
      // Returns just the toned vowel, not the full syllable
      expect(result).toBe('\u012b'); // ī
    });
  });

  // ── syllableSupportsToneMarking ──

  describe('syllableSupportsToneMarking', () => {
    it('should return true for syllable with vowel', () => {
      expect(syllableSupportsToneMarking('hao')).toBe(true);
    });

    it('should return false for no vowels', () => {
      expect(syllableSupportsToneMarking('')).toBe(false);
      expect(syllableSupportsToneMarking('r')).toBe(false);
    });
  });

  // ── shouldShowPinyinToneRow ──

  describe('shouldShowPinyinToneRow', () => {
    it('should show tone row when open and syllable has vowel', () => {
      const state = createPinyinKeyboardState('hao');
      state.toneRowOpen = true;
      expect(shouldShowPinyinToneRow(state)).toBe(true);
    });

    it('should not show tone row when closed', () => {
      const state = createPinyinKeyboardState('hao');
      expect(shouldShowPinyinToneRow(state)).toBe(false);
    });

    it('should not show tone row when no vowel in last syllable', () => {
      const state = createPinyinKeyboardState('r');
      state.toneRowOpen = true;
      expect(shouldShowPinyinToneRow(state)).toBe(false);
    });
  });

  // ── pendingSyllableTonePreview ──

  describe('pendingSyllableTonePreview', () => {
    it('should return toned vowel', () => {
      const state = createPinyinKeyboardState('ni');
      const result = pendingSyllableTonePreview(state, 1);
      // Returns just the toned vowel
      expect(result).toBe('\u012b'); // ī
    });

    it('should return empty for no vowel', () => {
      const state = createPinyinKeyboardState('r');
      const result = pendingSyllableTonePreview(state, 1);
      expect(result).toBe('');
    });
  });

  // ── applyPinyinKeyboardKey ──

  describe('applyPinyinKeyboardKey', () => {
    it('should append letter', () => {
      const state = createPinyinKeyboardState('');
      const result = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
      expect(result.value).toBe('n');
    });

    it('should open tone row on vowel', () => {
      const state = createPinyinKeyboardState('');
      const result = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
      expect(result.toneRowOpen).toBe(true);
    });

    it('should not open tone row on consonant', () => {
      const state = createPinyinKeyboardState('');
      const result = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'b' });
      expect(result.toneRowOpen).toBe(false);
    });

    it('should apply tone to last syllable', () => {
      const state = createPinyinKeyboardState('ni');
      state.toneRowOpen = true;
      const result = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 1 });
      expect(result.value).toBe('n\u012b');
      expect(result.toneRowOpen).toBe(true);
    });

    it('should not apply tone when tone row not open', () => {
      const state = createPinyinKeyboardState('ni');
      state.toneRowOpen = false;
      const result = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 1 });
      expect(result.value).toBe('ni');
    });

    it('should add space', () => {
      const state = createPinyinKeyboardState('ni');
      const result = applyPinyinKeyboardKey(state, { kind: 'space' });
      expect(result.value).toBe('ni ');
      expect(result.toneRowOpen).toBe(false);
    });

    it('should not add double space', () => {
      const state = createPinyinKeyboardState('ni ');
      const result = applyPinyinKeyboardKey(state, { kind: 'space' });
      expect(result.value).toBe('ni ');
    });

    it('should backspace', () => {
      const state = createPinyinKeyboardState('nia');
      const result = applyPinyinKeyboardKey(state, { kind: 'backspace' });
      expect(result.value).toBe('ni');
    });

    it('should close tone row on consonant backspace', () => {
      const state = createPinyinKeyboardState('niao');
      state.toneRowOpen = true;
      const result = applyPinyinKeyboardKey(state, { kind: 'backspace' });
      expect(result.value).toBe('nia');
    });
  });

  // ── pinyinKeyboardKeyLabel ──

  describe('pinyinKeyboardKeyLabel', () => {
    it('should return letter char', () => {
      expect(pinyinKeyboardKeyLabel({ kind: 'letter', char: 'a' })).toBe('a');
    });

    it('should return letter label when present', () => {
      expect(pinyinKeyboardKeyLabel({ kind: 'letter', char: 'v', label: 'ü' })).toBe('ü');
    });

    it('should return space label', () => {
      expect(pinyinKeyboardKeyLabel({ kind: 'space' })).toBe('\u2423');
    });

    it('should return backspace label', () => {
      expect(pinyinKeyboardKeyLabel({ kind: 'backspace' })).toBe('\u232b');
    });

    it('should return toned preview for tone key', () => {
      const result = pinyinKeyboardKeyLabel({ kind: 'tone', tone: 1 });
      expect(result).toBe('\u0101');
    });
  });

  // ── pinyinKeyboardKeyAriaLabel ──

  describe('pinyinKeyboardKeyAriaLabel', () => {
    it('should return letter aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'letter', char: 'a' })).toBe('Буква a');
    });

    it('should return letter label aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'letter', char: 'v', label: 'ü' })).toBe('Буква ü');
    });

    it('should return tone aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'tone', tone: 1 })).toBe(
        '1-\u0439 \u0442\u043e\u043d',
      );
    });

    it('should return light tone aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'tone', tone: 5 })).toBe(
        '\u041b\u0451\u0433\u043a\u0438\u0439 \u0442\u043e\u043d',
      );
    });

    it('should return space aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'space' })).toBe(
        '\u041f\u0440\u043e\u0431\u0435\u043b',
      );
    });

    it('should return backspace aria label', () => {
      expect(pinyinKeyboardKeyAriaLabel({ kind: 'backspace' })).toBe(
        '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
      );
    });
  });

  // ── pinyinKeyboardToneKeyAriaLabel ──

  describe('pinyinKeyboardToneKeyAriaLabel', () => {
    it('should return tone aria label with preview', () => {
      const state = createPinyinKeyboardState('ni');
      const result = pinyinKeyboardToneKeyAriaLabel(state, 1);
      expect(result).toContain('1-\u0439 \u0442\u043e\u043d');
      expect(result).toContain('\u012b');
    });

    it('should return light tone aria label', () => {
      const state = createPinyinKeyboardState('ni');
      const result = pinyinKeyboardToneKeyAriaLabel(state, 5);
      expect(result).toContain('\u041b\u0451\u0433\u043a\u0438\u0439 \u0442\u043e\u043d');
    });
  });
});
