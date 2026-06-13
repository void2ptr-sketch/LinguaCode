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
});
