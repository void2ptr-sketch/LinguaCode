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
        question: 'Вопрос?',
        options: ['A', 'B'],
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
        prompt: 'Найдите пары',
        pairs: [{ front: 'A', back: 'B' }],
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
        prompt: 'Введите ответ',
        acceptedAnswers: ['hello'],
        appearance,
      },
      'keyboard-1',
    );

    expect(card?.acceptedAnswers).toEqual(['hello']);
  });

  it('should reject timed card with short limit', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        question: 'Q?',
        options: ['A', 'B'],
        correctIndex: 0,
        timeLimitSec: 2,
        appearance,
      },
      'timed-1',
    );

    expect(card).toBeNull();
  });
});
