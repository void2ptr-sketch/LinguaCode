import { describe, expect, it } from 'vitest';
import { resolveKeyboardAnswerMode } from './keyboard-answer-mode.utils';
import type { KeyboardCard } from '../../model';

describe('keyboard-answer-mode.utils', () => {
  // ── resolveKeyboardAnswerMode ──

  describe('resolveKeyboardAnswerMode', () => {
    it('should return ipa when mode is ipa', () => {
      const card = {
        answerMode: 'ipa' as const,
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('ipa');
    });

    it('should return pinyin when mode is pinyin', () => {
      const card = {
        answerMode: 'pinyin' as const,
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });

    it('should return text when mode is text', () => {
      const card = {
        answerMode: 'text' as const,
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('text');
    });

    it('should default to auto mode', () => {
      const card = {
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(card.answerMode).toBeUndefined();
    });

    it('should return ipa when prompt lexeme has IPA', () => {
      const card = {
        promptLexeme: { ipa: 'n\u01d0 h\u1ea3o', primary: '\u4f60\u597d', script: 'latn' as never },
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('ipa');
    });

    it('should return pinyin when prompt lexeme has hanzi script with pinyin', () => {
      const card = {
        promptLexeme: { script: 'hani' as never, pinyin: 'nihao', primary: '\u4f60\u597d' },
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });

    it('should return pinyin when accepted answer looks like pinyin (letters)', () => {
      const card = {
        acceptedAnswersKnown: ['nihao', 'hello'],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });

    it('should return pinyin for plain English answers (regex matches letters)', () => {
      const card = {
        acceptedAnswersKnown: ['hello', 'world'],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      // The regex /^[a-zA-Z...]/ matches plain English too
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });

    it('should return pinyin when prompt has English primary (regex matches)', () => {
      const card = {
        promptLexeme: { primary: 'Hello', script: 'latn' as never },
        acceptedAnswersKnown: ['Hello', 'World'],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      // The regex /^[a-zA-Z...]/ matches plain English too
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });

    it('should prefer explicit mode over auto-detection', () => {
      const card = {
        answerMode: 'text' as const,
        promptLexeme: { ipa: 'n\u01d0 h\u1ea3o', primary: '\u4f60\u597d', script: 'latn' as never },
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('text');
    });

    it('should handle empty accepted answers with hanzi pinyin', () => {
      const card = {
        promptLexeme: { script: 'hani' as never, pinyin: 'shi', primary: '\u662f' },
        acceptedAnswersKnown: [],
      } as Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>;
      expect(resolveKeyboardAnswerMode(card)).toBe('pinyin');
    });
  });
});
