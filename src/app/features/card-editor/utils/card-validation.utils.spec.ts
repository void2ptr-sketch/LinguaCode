import {
  normalizeKeyboardCardDraft,
  normalizeMemoryCardDraft,
  normalizeSelectCardDraft,
  normalizeTimedCardDraft,
} from './card-validation.utils';
import { emptyLexemeCardDraft, emptyMemoryPairDraft, emptyOptionLexemes } from '../types';
import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';

describe('card-validation.utils', () => {
  const appearance = { theme: 'azure-blue', fontSize: 'md' as const };
  const lexemeDraft = emptyLexemeCardDraft();

  it('should normalize valid select card draft', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card?.kind).toBe('select');
    expect(card?.title).toBe('Тест');
  });

  it('should preserve prompt lexeme in select card', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Китайский',
        direction: 'known-to-learning',
        promptKnown: 'Привет',
        optionsLearning: ['你好', '谢谢'],
        optionsLexemes: [
          {
            primary: '你好',
            script: 'hani',
            pinyin: 'nǐ hǎo',
            zhuyin: '',
            palladius: 'ни хао',
            ipa: '',
            audioUrl: '',
            acceptedReadings: '',
          },
          emptyLexemeDraftFields('hani'),
        ],
        correctIndex: 0,
        appearance,
        promptLexeme: {
          primary: '你好',
          script: 'hani',
          pinyin: 'nǐ hǎo',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
          acceptedReadings: '',
        },
        audioUrl: '',
      },
      'card-zh',
    );

    expect(card?.promptLexeme?.primary).toBe('你好');
    expect(card?.optionsLexemes?.[0]?.palladius).toBe('ни хао');
  });

  it('should normalize memory card draft', () => {
    const pair = { ...emptyMemoryPairDraft(), known: 'A', learning: 'B' };
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: 'Пары',
        promptKnown: 'Найдите пары',
        pairs: [pair],
        appearance,
        ...lexemeDraft,
      },
      'memory-1',
    );

    expect(card?.kind).toBe('memory');
    expect(card?.pairs.length).toBe(1);
  });

  it('should normalize keyboard card draft', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Ввод',
        direction: 'known-to-learning',
        promptKnown: 'Введите ответ',
        acceptedAnswersKnown: ['hello'],
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card?.acceptedAnswersKnown).toEqual(['hello']);
  });

  it('should reject timed card with short limit', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 2,
        appearance,
        ...lexemeDraft,
      },
      'timed-1',
    );

    expect(card).toBeNull();
  });
});
