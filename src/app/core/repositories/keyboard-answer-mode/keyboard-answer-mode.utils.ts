import type { KeyboardCard } from '../../models';
import { isLikelyIpa } from '../ipa/ipa-normalize.utils';
import { resolveIpaString } from '../phonetic/phonetic-lexeme.utils';

/**
 * Resolved keyboard answer mode after auto-detection.
 *
 * @remarks
 * `'text'` — standard text input; `'ipa'` — IPA transcription; `'pinyin'` — Pinyin input.
 */
export type ResolvedKeyboardAnswerMode = 'text' | 'ipa' | 'pinyin';

/**
 * Resolves the keyboard answer mode for a keyboard card.
 *
 * @param card - The keyboard card (partial, only mode-related fields).
 * @returns The resolved input mode: `'text'`, `'ipa'`, or `'pinyin'`.
 * @remarks
 * When `answerMode` is `'auto'` (default), the function infers the mode
 * from the prompt lexeme (IPA, Pinyin) and accepted answers.
 */
export function resolveKeyboardAnswerMode(
  card: Pick<KeyboardCard, 'answerMode' | 'acceptedAnswersKnown' | 'promptLexeme'>,
): ResolvedKeyboardAnswerMode {
  const mode = card.answerMode ?? 'auto';

  if (mode === 'ipa') {
    return 'ipa';
  }

  if (mode === 'pinyin') {
    return 'pinyin';
  }

  if (mode === 'text') {
    return 'text';
  }

  if (resolveIpaString(card.promptLexeme?.ipa)) {
    return 'ipa';
  }

  if (shouldUsePinyinKeyboard(card)) {
    return 'pinyin';
  }

  return card.acceptedAnswersKnown.some((answer) => isLikelyIpa(answer)) ? 'ipa' : 'text';
}

function shouldUsePinyinKeyboard(
  card: Pick<KeyboardCard, 'acceptedAnswersKnown' | 'promptLexeme'>,
): boolean {
  const lexeme = card.promptLexeme;
  if (lexeme?.script === 'hani' && typeof lexeme.pinyin === 'string' && lexeme.pinyin.trim()) {
    return true;
  }

  return card.acceptedAnswersKnown.some((answer) => looksLikePinyinAnswer(answer));
}

function looksLikePinyinAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) {
    return false;
  }

  return /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv\s'-]+$/u.test(trimmed);
}
