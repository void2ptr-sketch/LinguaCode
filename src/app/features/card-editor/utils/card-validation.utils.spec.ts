import {
  normalizeKeyboardCardDraft,
  normalizeMemoryCardDraft,
  normalizeSelectCardDraft,
  normalizeTimedCardDraft,
} from './card-validation.utils';

describe('card-validation.utils', () => {
  const appearance = { theme: 'azure-blue', fontSize: 'md' as const };

  it('should normalize valid select card draft', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B'],
        correctIndex: 0,
        appearance,
      },
      'card-1',
    );

    expect(card?.kind).toBe('select');
    expect(card?.title).toBe('Тест');
  });

  it('should normalize memory card draft', () => {
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: 'Пары',
        promptKnown: 'Найдите пары',
        pairs: [{ known: 'A', learning: 'B' }],
        appearance,
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
        correctIndex: 0,
        timeLimitSec: 2,
        appearance,
      },
      'timed-1',
    );

    expect(card).toBeNull();
  });
});
