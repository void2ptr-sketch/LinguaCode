import type { OptionCard } from '../models';
import {
  cardDefaultDirection,
  cardSupportsSessionDirection,
  effectiveCardDirection,
  extractQuotedLemma,
  resolveKeyboardAcceptedAnswers,
  resolveKeyboardPrompt,
  resolveOptionCard,
} from './card-direction.utils';

describe('card-direction.utils', () => {
  const selectCard: OptionCard = {
    id: 'select-1',
    kind: 'select',
    title: 'Test',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Как сказать «Привет» по-английски?',
    optionsLearning: ['Hello', 'Goodbye', 'Thanks'],
    optionsKnown: ['Привет', 'Пока', 'Спасибо'],
    correctIndex: 0,
  };

  it('should prefer session direction over card default', () => {
    expect(effectiveCardDirection('known-to-learning', 'learning-to-known')).toBe(
      'learning-to-known',
    );
  });

  it('should resolve known-to-learning select card', () => {
    const resolved = resolveOptionCard(selectCard, 'known-to-learning');
    expect(resolved.prompt).toBe(selectCard.promptKnown);
    expect(resolved.options).toEqual(['Hello', 'Goodbye', 'Thanks']);
    expect(resolved.correctIndex).toBe(0);
  });

  it('should resolve learning-to-known select card', () => {
    const resolved = resolveOptionCard(selectCard, 'learning-to-known');
    expect(resolved.prompt).toBe('Hello');
    expect(resolved.options).toEqual(['Привет', 'Пока', 'Спасибо']);
    expect(resolved.correctIndex).toBe(0);
    expect(resolved.optionLexemes?.map((item) => item?.primary)).toEqual([
      'Привет',
      'Пока',
      'Спасибо',
    ]);
  });

  it('should show known-language primary for correct option lexeme in learning-to-known', () => {
    const card: OptionCard = {
      id: 'select-zh-1',
      kind: 'select',
      title: 'Приветствие (китайский)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Как сказать «Привет» по-китайски?',
      promptLexeme: {
        primary: '你好',
        script: 'hani',
        glossKnown: 'Привет',
      },
      optionsLearning: ['你好', '谢谢'],
      optionsKnown: ['Привет', 'Спасибо'],
      optionsLexemes: [
        { primary: '你好', script: 'hani', glossKnown: 'Привет' },
        { primary: '谢谢', script: 'hani', glossKnown: 'Спасибо' },
      ],
      correctIndex: 0,
    };

    const resolved = resolveOptionCard(card, 'learning-to-known');
    expect(resolved.optionLexemes?.[0]?.primary).toBe('Привет');
    expect(resolved.optionLexemes?.[1]?.primary).toBe('Спасибо');
  });

  it('should fill distractors from glossKnown when prompt quote covers only correct answer', () => {
    const card: OptionCard = {
      ...selectCard,
      optionsKnown: undefined,
      optionsLexemes: [
        { primary: 'Hello', script: 'latn', glossKnown: 'Привет' },
        { primary: 'Goodbye', script: 'latn', glossKnown: 'Пока' },
        { primary: 'Thanks', script: 'latn', glossKnown: 'Спасибо' },
      ],
    };

    const resolved = resolveOptionCard(card, 'learning-to-known');
    expect(resolved.options).toEqual(['Привет', 'Пока', 'Спасибо']);
  });

  it('should prefer optionsKnown over quoted prompt fallback for distractors', () => {
    const card: OptionCard = {
      ...selectCard,
      optionsKnown: ['Привет', 'Пока', 'Спасибо'],
      optionsLexemes: undefined,
    };

    const resolved = resolveOptionCard(card, 'learning-to-known');
    expect(resolved.options).toEqual(['Привет', 'Пока', 'Спасибо']);
  });

  it('should derive known options from glossKnown when optionsKnown missing', () => {
    const card: OptionCard = {
      ...selectCard,
      optionsKnown: undefined,
      optionsLexemes: [
        { primary: 'Hello', script: 'latn', glossKnown: 'Привет' },
        { primary: 'Goodbye', script: 'latn', glossKnown: 'Пока' },
        { primary: 'Thanks', script: 'latn', glossKnown: 'Спасибо' },
      ],
    };

    const resolved = resolveOptionCard(card, 'learning-to-known');
    expect(resolved.options).toEqual(['Привет', 'Пока', 'Спасибо']);
    expect(resolved.optionLexemes?.map((item) => item?.primary)).toEqual([
      'Привет',
      'Пока',
      'Спасибо',
    ]);
  });

  it('should resolve sound card in both directions', () => {
    const soundCard: OptionCard = {
      id: 'sound-1',
      kind: 'sound',
      title: 'Sound',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Как переводится услышанное слово?',
      audioLabelLearning: 'Hello',
      optionsKnown: ['Привет', 'Пока'],
      correctIndex: 0,
    };

    expect(resolveOptionCard(soundCard, 'known-to-learning').options).toEqual(['Привет', 'Пока']);
    expect(resolveOptionCard(soundCard, 'known-to-learning').prompt).toBe(
      'Как переводится услышанное слово?',
    );
    expect(resolveOptionCard(soundCard, 'learning-to-known').prompt).toBe(
      'Как переводится услышанное слово?',
    );
    expect(resolveOptionCard(soundCard, 'learning-to-known').options).toEqual(['Привет', 'Пока']);
  });

  it('should resolve keyboard prompt and accepted answers by direction', () => {
    const keyboardCard = {
      id: 'keyboard-1',
      kind: 'keyboard' as const,
      title: 'Keyboard',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Введите перевод слова «Hello»',
      acceptedAnswersKnown: ['Привет'],
      acceptedAnswersLearning: ['Hello', 'hello'],
    };

    expect(resolveKeyboardPrompt(keyboardCard, 'learning-to-known')).toBe('Hello');
    expect(resolveKeyboardAcceptedAnswers(keyboardCard, 'learning-to-known')).toEqual(['Привет']);
    expect(resolveKeyboardPrompt(keyboardCard, 'known-to-learning')).toBe('Привет');
    expect(resolveKeyboardAcceptedAnswers(keyboardCard, 'known-to-learning')).toEqual([
      'Hello',
      'hello',
    ]);
  });

  it('should extract quoted lemma from prompt text', () => {
    expect(extractQuotedLemma('Как сказать «Привет»?')).toBe('Привет');
    expect(extractQuotedLemma('Translate "Hello"')).toBe('Hello');
  });

  it('should read default direction from card payload', () => {
    expect(cardDefaultDirection(selectCard)).toBe('known-to-learning');
    expect(
      cardDefaultDirection({
        id: 'memory-1',
        kind: 'memory',
        title: 'Memory',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptKnown: 'Pairs',
        pairs: [{ known: 'A', learning: 'B' }],
      }),
    ).toBe('known-to-learning');
  });

  it('should hide session direction toggle for draw and tone cards', () => {
    expect(
      cardSupportsSessionDirection({
        id: 'draw-1',
        kind: 'draw',
        title: 'Draw',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptKnown: 'Draw',
        referenceHintKnown: 'hint',
      }),
    ).toBeFalse();
    expect(
      cardSupportsSessionDirection({
        id: 'tone-1',
        kind: 'tone',
        title: 'Tone',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        direction: 'known-to-learning',
        promptKnown: 'Tone',
        syllableBase: 'ma',
        toneOptions: [1, 2, 3, 4],
        correctIndex: 0,
      }),
    ).toBeFalse();
    expect(cardSupportsSessionDirection(selectCard)).toBeTrue();
    expect(cardSupportsSessionDirection(null)).toBeFalse();
  });
});
