import { resolveKeyboardAnswerMode } from './keyboard-answer-mode.utils';

describe('keyboard-answer-mode.utils', () => {
  const baseCard = {
    acceptedAnswersKnown: ['привет'],
    promptLexeme: undefined,
  };

  it('should honor explicit ipa mode', () => {
    expect(resolveKeyboardAnswerMode({ ...baseCard, answerMode: 'ipa' })).toBe('ipa');
  });

  it('should honor explicit pinyin mode', () => {
    expect(resolveKeyboardAnswerMode({ ...baseCard, answerMode: 'pinyin' })).toBe('pinyin');
  });

  it('should honor explicit text mode', () => {
    expect(resolveKeyboardAnswerMode({ ...baseCard, answerMode: 'text' })).toBe('text');
  });

  it('should auto-detect ipa from prompt lexeme', () => {
    expect(
      resolveKeyboardAnswerMode({
        ...baseCard,
        answerMode: 'auto',
        promptLexeme: { primary: 'Hello', script: 'latn', ipa: 'həˈləʊ' },
      }),
    ).toBe('ipa');
  });

  it('should auto-detect pinyin from han lexeme', () => {
    expect(
      resolveKeyboardAnswerMode({
        ...baseCard,
        answerMode: 'auto',
        promptLexeme: { primary: '你好', script: 'hani', pinyin: 'nǐ hǎo' },
      }),
    ).toBe('pinyin');
  });

  it('should auto-detect ipa from accepted answers', () => {
    expect(
      resolveKeyboardAnswerMode({
        acceptedAnswersKnown: ['həˈləʊ'],
        promptLexeme: undefined,
        answerMode: 'auto',
      }),
    ).toBe('ipa');
  });

  it('should default auto mode to text for plain answers', () => {
    expect(resolveKeyboardAnswerMode({ ...baseCard, answerMode: 'auto' })).toBe('text');
  });
});
