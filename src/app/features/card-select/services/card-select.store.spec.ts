import { Card } from '../../../core/models';
import { CardSelectStore } from './card-select.store';

const CARDS: readonly Card[] = [
  {
    id: 'c1',
    kind: 'select',
    title: 'Test 1',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    question: 'Q1?',
    options: ['A', 'B'],
    correctIndex: 0,
  },
  {
    id: 'c2',
    kind: 'keyboard',
    title: 'Test 2',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    prompt: 'Type hi',
    acceptedAnswers: ['hi'],
  },
];

describe('CardSelectStore', () => {
  let store: CardSelectStore;

  beforeEach(() => {
    store = new CardSelectStore();
    store.setScenario('scenario-1', CARDS);
  });

  it('should expose current card and progress', () => {
    expect(store.currentCard()?.id).toBe('c1');
    expect(store.progressLabel()).toBe('1 / 2');
  });

  it('should check select answer and move to next card', () => {
    store.selectOption(0);
    expect(store.checkAnswer()).toBeTrue();
    expect(store.feedback()).toBe('correct');

    store.nextCard();
    expect(store.currentCard()?.id).toBe('c2');
    expect(store.feedback()).toBeNull();
  });

  it('should check keyboard answer', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    store.setAnswerText('hi');
    expect(store.checkAnswer()).toBeTrue();
  });

  it('should complete scenario on last card', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();

    expect(store.completed()).toBeTrue();
  });

  it('should reset to initial state', () => {
    store.setLoading(true);
    store.selectOption(0);
    store.reset();

    expect(store.cards()).toEqual([]);
    expect(store.loading()).toBeFalse();
    expect(store.completed()).toBeFalse();
  });
});
