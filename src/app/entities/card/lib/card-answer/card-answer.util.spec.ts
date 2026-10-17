import { checkCardAnswer, canCheckCardAnswer, getCorrectAnswerLabel } from './card-answer.util';
import { createCardAnswerState } from '../../model/card-interaction.types';

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

    expect(canCheckCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
    expect(getCorrectAnswerLabel(card)).toBe('A');
  });

  it('should validate code-select cards by index', () => {
    const card = {
      id: 'code-1',
      kind: 'code-select' as const,
      title: 'Perl',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      prompt: { language: 'perl' as const, code: 'print 1;' },
      options: [
        { language: 'perl' as const, code: '1' },
        { language: 'perl' as const, code: '0' },
      ],
      correctIndex: 0,
    };

    expect(canCheckCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 1 })).toBe(false);
    expect(getCorrectAnswerLabel(card)).toBe('1');
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

    expect(checkCardAnswer(card, { ...baseState, answerText: '  HELLO ' })).toBe(true);
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
    ).toBe(true);
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
    ).toBe(true);
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
    ).toBe(true);
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

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
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

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(true);
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

    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 1 })).toBe(true);
    expect(checkCardAnswer(card, { ...baseState, selectedIndex: 0 })).toBe(false);
  });

  // ── Uncovered branches ──

  it('should return promptLexeme.primary when keyboard has no accepted answers', () => {
    const card = {
      id: 'kb-no-accepted',
      kind: 'keyboard' as const,
      title: 'No accepted',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Type it',
      acceptedAnswersKnown: [],
      promptLexeme: {
        primary: '你好',
        script: 'hani' as const,
      },
    };

    expect(getCorrectAnswerLabel(card)).toBe('你好');
  });

  it('should return null for keyboard with no accepted and no promptLexeme', () => {
    const card = {
      id: 'kb-empty',
      kind: 'keyboard' as const,
      title: 'Empty',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Type it',
      acceptedAnswersKnown: [],
    };

    expect(getCorrectAnswerLabel(card)).toBeNull();
  });

  it('should return null for memory card correct answer label', () => {
    const card = {
      id: 'mem-1',
      kind: 'memory' as const,
      pairs: [],
      title: 'Memory',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      promptKnown: 'Mem',
    };

    expect(getCorrectAnswerLabel(card)).toBeNull();
  });

  it('should return null for draw card correct answer label', () => {
    const card = {
      id: 'draw-1',
      kind: 'draw' as const,
      title: 'Draw',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      promptKnown: 'Draw it',
      referenceHintKnown: 'hint',
    };

    expect(getCorrectAnswerLabel(card)).toBeNull();
  });

  it('should not allow checking timed card without selection', () => {
    const card = {
      id: 'timed-1',
      kind: 'timed' as const,
      timeLimitSec: 30,
      title: 'Timed',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Timed',
      optionsLearning: ['A'],
      correctIndex: 0,
    };

    expect(canCheckCardAnswer(card, baseState)).toBe(false);
  });

  it('should not allow checking memory card when not complete', () => {
    const card = {
      id: 'mem-1',
      kind: 'memory' as const,
      pairs: [],
      title: 'Memory',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      promptKnown: 'Mem',
    };

    expect(canCheckCardAnswer(card, baseState)).toBe(false);
    expect(checkCardAnswer(card, baseState)).toBeNull();
  });

  it('should allow checking memory card when complete', () => {
    const card = {
      id: 'mem-1',
      kind: 'memory' as const,
      pairs: [],
      title: 'Memory',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      promptKnown: 'Mem',
    };

    expect(canCheckCardAnswer(card, { ...baseState, memoryComplete: true })).toBe(true);
    expect(checkCardAnswer(card, { ...baseState, memoryComplete: true })).toBe(true);
  });

  it('should not allow checking draw card when not submitted', () => {
    const card = {
      id: 'draw-1',
      kind: 'draw' as const,
      title: 'Draw',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      promptKnown: 'Draw it',
      referenceHintKnown: 'hint',
    };

    expect(canCheckCardAnswer(card, baseState)).toBe(false);
    expect(checkCardAnswer(card, baseState)).toBeNull();
  });

  it('should match zhuyin keyboard answers', () => {
    const card = {
      id: 'zhuyin-1',
      kind: 'keyboard' as const,
      title: 'Zhuyin',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: 'Чжуйинь',
      acceptedAnswersKnown: ['ㄋㄧˇ ㄏㄠˇ'],
      promptLexeme: {
        primary: '你好',
        script: 'hani' as const,
        zhuyin: 'ㄋㄧˇ ㄏㄠˇ',
      },
    };

    expect(
      checkCardAnswer(card, {
        ...baseState,
        answerText: 'ㄋㄧˇ ㄏㄠˇ',
      }),
    ).toBe(true);
  });
});
