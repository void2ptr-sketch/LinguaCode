import { checkCardAnswer, canCheckCardAnswer, getCorrectAnswerLabel } from './card-answer.utils';
import { createCardAnswerState } from '../types';

const baseState = createCardAnswerState('beginner');

describe('card-answer.utils', () => {
  it('should validate option cards', () => {
    const card = {
      id: '1',
      kind: 'select' as const,
      title: 'Test',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Q?',
      optionsLearning: ['A', 'B'],
      correctIndex: 0,
    };

    expect(canCheckCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBeTrue();
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBeTrue();
    expect(getCorrectAnswerLabel(card)).toBe('A');
  });

  it('should validate keyboard answers', () => {
    const card = {
      id: '2',
      kind: 'keyboard' as const,
      title: 'Test',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Type hello',
      acceptedAnswersKnown: ['Hello', 'hello'],
    };

    expect(checkCardAnswer(card, { ...baseState, answerText: '  HELLO ' })).toBeTrue();
  });

  it('should match palladius keyboard answer', () => {
    const card = {
      id: '3',
      kind: 'keyboard' as const,
      title: 'Китайский',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Введите чтение',
      acceptedAnswersKnown: ['ни хао'],
      promptLexeme: {
        primary: '你好',
        script: 'hani' as const,
        pinyin: 'nǐ hǎo',
        palladius: 'ни хао',
      },
    };

    expect(
      checkCardAnswer(card, {
        ...baseState,
        answerText: 'Ни хао',
      }),
    ).toBeTrue();
  });

  it('should match ipa keyboard answers', () => {
    const card = {
      id: '5',
      kind: 'keyboard' as const,
      title: 'IPA keyboard',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Транскрипция Hello',
      acceptedAnswersKnown: ['həˈləʊ'],
      answerMode: 'ipa' as const,
      promptLexeme: {
        primary: 'Hello',
        script: 'latn' as const,
        ipa: 'həˈləʊ',
      },
    };

    expect(
      checkCardAnswer(card, {
        ...baseState,
        answerText: '[həˈləʊ]',
      }),
    ).toBeTrue();
  });

  it('should match pinyin keyboard answers with tone marks', () => {
    const card = {
      id: '5b',
      kind: 'keyboard' as const,
      title: 'Pinyin keyboard',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Пиньинь для 你好',
      acceptedAnswersKnown: ['nǐ hǎo'],
      answerMode: 'pinyin' as const,
      promptLexeme: {
        primary: '你好',
        script: 'hani' as const,
        pinyin: 'nǐ hǎo',
      },
    };

    expect(
      checkCardAnswer(card, {
        ...baseState,
        answerText: 'ni hao',
      }),
    ).toBeTrue();
  });

  it('should prefer lexeme primary in correct answer label', () => {
    const card = {
      id: '4',
      kind: 'select' as const,
      title: 'IPA',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Hello',
      optionsLearning: ['Hello'],
      optionsLexemes: [{ primary: 'Hello', script: 'latn' as const, ipa: 'həˈləʊ' }],
      correctIndex: 0,
    };

    expect(getCorrectAnswerLabel(card)).toBe('Hello');
  });

  it('should validate tone card answers', () => {
    const card = {
      id: '6',
      kind: 'tone' as const,
      title: 'Тон',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Тон 妈',
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4] as const,
      correctIndex: 0,
    };

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBeTrue();
    expect(getCorrectAnswerLabel(card)).toBe('1');
  });

  it('should validate reading card answers for contextual word readings', () => {
    const card = {
      id: 'reading-xing-1',
      kind: 'reading' as const,
      title: 'Полифония: 行',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Как читается «银行»?',
      promptLexeme: {
        primary: '银行',
        script: 'hani' as const,
        pinyin: 'yínháng',
        palladius: 'инь хан',
      },
      optionsLearning: ['银行', 'yínxíng'],
      optionsLexemes: [
        {
          primary: '银行',
          script: 'hani' as const,
          pinyin: 'yínháng',
          palladius: 'инь хан',
        },
        {
          primary: 'yínxíng',
          script: 'latn' as const,
          pinyin: 'yínxíng',
        },
      ],
      correctIndex: 0,
    };

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBeTrue();
    expect(getCorrectAnswerLabel(card)).toBe('yínháng');
  });

  it('should accept reading card answer by full-word pinyin alias', () => {
    const card = {
      id: 'reading-xing-1',
      kind: 'reading' as const,
      title: 'Полифония: 行',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Как читается «银行»?',
      promptLexeme: {
        primary: '银行',
        script: 'hani' as const,
        pinyin: 'yínháng',
        palladius: 'инь хан',
      },
      optionsLearning: ['yínxíng', 'yínháng'],
      optionsLexemes: [
        {
          primary: 'yínxíng',
          script: 'latn' as const,
          pinyin: 'yínxíng',
        },
        {
          primary: 'yínháng',
          script: 'latn' as const,
          pinyin: 'yínháng',
          palladius: 'инь хан',
        },
      ],
      correctIndex: 1,
    };

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 1 })).toBeTrue();
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBeFalse();
  });
});
