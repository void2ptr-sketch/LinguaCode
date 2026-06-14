import { checkCardAnswer, canCheckCardAnswer, getCorrectAnswerLabel } from './card-answer.utils';

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

    expect(canCheckCardAnswer(card, { selectedIndex: 0, answerText: '', memoryComplete: false, drawSubmitted: false })).toBeTrue();
    expect(checkCardAnswer(card, { selectedIndex: 0, answerText: '', memoryComplete: false, drawSubmitted: false })).toBeTrue();
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

    expect(checkCardAnswer(card, { selectedIndex: null, answerText: '  HELLO ', memoryComplete: false, drawSubmitted: false })).toBeTrue();
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
        selectedIndex: null,
        answerText: 'Ни хао',
        memoryComplete: false,
        drawSubmitted: false,
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
        selectedIndex: null,
        answerText: '[həˈləʊ]',
        memoryComplete: false,
        drawSubmitted: false,
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
        selectedIndex: null,
        answerText: 'ni hao',
        memoryComplete: false,
        drawSubmitted: false,
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

    expect(
      checkCardAnswer(card, {
        selectedIndex: 0,
        answerText: '',
        memoryComplete: false,
        drawSubmitted: false,
      }),
    ).toBeTrue();
    expect(getCorrectAnswerLabel(card)).toBe('1');
  });

  it('should validate reading card answers', () => {
    const card = {
      id: '7',
      kind: 'reading' as const,
      title: '行',
      appearance: { theme: 'azure-blue', fontSize: 'md' as const },
      direction: 'known-to-learning' as const,
      promptKnown: '银行',
      optionsLearning: ['háng', 'xíng'],
      correctIndex: 0,
    };

    expect(
      checkCardAnswer(card, {
        selectedIndex: 0,
        answerText: '',
        memoryComplete: false,
        drawSubmitted: false,
      }),
    ).toBeTrue();
  });
});
