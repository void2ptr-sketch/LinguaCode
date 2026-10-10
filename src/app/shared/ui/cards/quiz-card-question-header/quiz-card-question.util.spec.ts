import { describe, expect, it } from 'vitest';

import {
  quizQuestionPromptText,
  resolveQuizQuestionHeaderDisplay,
} from './quiz-card-question.util';

describe('resolveQuizQuestionHeaderDisplay', () => {
  it('shows prompt when it is set', () => {
    expect(resolveQuizQuestionHeaderDisplay('Новая карточка', 'Что такое scalar context?')).toBe(
      'prompt-only',
    );
  });

  it('shows title only when prompt is empty', () => {
    expect(resolveQuizQuestionHeaderDisplay('Только заголовок', '')).toBe('title-only');
  });

  it('shows title only when prompt is whitespace', () => {
    expect(resolveQuizQuestionHeaderDisplay('Заголовок', '   ')).toBe('title-only');
  });

  it('prefers prompt even when title matches', () => {
    expect(
      resolveQuizQuestionHeaderDisplay(
        'Что такое scalar context? (1/2)',
        'Что такое scalar context?',
      ),
    ).toBe('prompt-only');
  });
});

describe('quizQuestionPromptText', () => {
  it('returns prompt text when prompt is available', () => {
    expect(quizQuestionPromptText('Карточка 1', 'Какой sigil у массива?')).toBe(
      'Какой sigil у массива?',
    );
  });

  it('returns title when prompt is empty', () => {
    expect(quizQuestionPromptText('Только заголовок', '')).toBe('Только заголовок');
  });

  it('returns trimmed title when prompt is whitespace', () => {
    expect(quizQuestionPromptText('Заголовок', '   ')).toBe('Заголовок');
  });

  it('returns trimmed prompt text', () => {
    expect(quizQuestionPromptText('Title', '  Вопрос  ')).toBe('Вопрос');
  });
});
