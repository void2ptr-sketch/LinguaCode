import { quizQuestionPromptText, resolveQuizQuestionHeaderDisplay } from './quiz-card-question.utils';

describe('resolveQuizQuestionHeaderDisplay', () => {
  it('shows prompt when it is set', () => {
    expect(
      resolveQuizQuestionHeaderDisplay('Новая карточка', 'Что такое scalar context?'),
    ).toBe('prompt-only');
  });

  it('shows title only when prompt is empty', () => {
    expect(resolveQuizQuestionHeaderDisplay('Только заголовок', '')).toBe('title-only');
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
  it('returns prompt text for learning display', () => {
    expect(quizQuestionPromptText('Карточка 1', 'Какой sigil у массива?')).toBe(
      'Какой sigil у массива?',
    );
  });
});
