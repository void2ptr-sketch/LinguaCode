import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Card } from '../../../core/models';
import { CardSelectStore } from './card-select.store';

const CARDS: readonly Card[] = [
  {
    id: 'c1',
    kind: 'select',
    title: 'Test 1',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Q1?',
    optionsLearning: ['A', 'B'],
    correctIndex: 0,
  },
  {
    id: 'c2',
    kind: 'keyboard',
    title: 'Test 2',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Type hi',
    acceptedAnswersKnown: ['hi'],
  },
  {
    id: 'c3',
    kind: 'memory',
    title: 'Test 3',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Memory',
    pairs: [
      { known: 'A', learning: 'B' },
      { known: 'C', learning: 'D' },
    ],
  },
];

describe('CardSelectStore', () => {
  let store: CardSelectStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(CardSelectStore);
    store.setScenario('scenario-1', CARDS);
  });

  it('should expose current card and progress', () => {
    expect(store.currentCard()?.id).toBe('c1');
    expect(store.progressLabel()).toBe('1 / 3');
  });

  it('should check select answer and move to next card', () => {
    store.selectOption(0);
    expect(store.checkAnswer()).toBe(true);
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
    expect(store.checkAnswer()).toBe(true);
  });

  it('should complete scenario on last card', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();

    expect(store.completed()).toBe(true);
  });

  it('should reset to initial state', () => {
    store.setLoading(true);
    store.selectOption(0);
    store.reset();

    expect(store.cards()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.completed()).toBe(false);
  });

  // ─── setLoading ───────────────────────────────────────────────────────

  it('should set loading state', () => {
    store.setLoading(true);
    expect(store.loading()).toBe(true);
  });

  it('should clear error when loading starts', () => {
    store.setError('test error');
    store.setLoading(true);
    expect(store.error()).toBeNull();
  });

  it('should not clear error when loading stops', () => {
    store.setError('test error');
    store.setLoading(false);
    expect(store.error()).toBe('test error');
  });

  // ─── setError ─────────────────────────────────────────────────────────

  it('should set error message and stop loading', () => {
    store.setLoading(true);
    store.setError('Something went wrong');
    expect(store.error()).toBe('Something went wrong');
    expect(store.loading()).toBe(false);
  });

  // ─── selectOption ─────────────────────────────────────────────────────

  it('should select option when no feedback', () => {
    store.selectOption(1);
    expect(store.selectedIndex()).toBe(1);
  });

  it('should not select option when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.selectOption(1);
    expect(store.selectedIndex()).toBe(0);
  });

  it('should not select option when completed', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    store.selectOption(1);
    expect(store.selectedIndex()).toBe(0);
  });

  // ─── setAnswerText ────────────────────────────────────────────────────

  it('should set answer text when no feedback', () => {
    store.setAnswerText('hello');
    expect(store.answerText()).toBe('hello');
  });

  it('should not set answer text when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.setAnswerText('hello');
    expect(store.answerText()).toBe('');
  });

  // ─── setMemoryComplete ────────────────────────────────────────────────

  it('should set memory complete when no feedback', () => {
    store.setMemoryComplete(true);
    expect(store.memoryComplete()).toBe(true);
  });

  it('should not set memory complete when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.setMemoryComplete(true);
    expect(store.memoryComplete()).toBe(false);
  });

  // ─── setDrawSubmitted ─────────────────────────────────────────────────

  it('should set draw submitted when no feedback', () => {
    store.setDrawSubmitted(true);
    expect(store.drawSubmitted()).toBe(true);
  });

  it('should clear draw answer when drawSubmitted is false', () => {
    store.setDrawSubmitted(true);
    const payload = { canvasMode: 'write' as any, canvasSize: { width: 100, height: 100 }, strokesByCharacter: [] };
    store.setDrawAnswer(payload);
    store.setDrawSubmitted(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
  });

  it('should not set draw submitted when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.setDrawSubmitted(true);
    expect(store.drawSubmitted()).toBe(false);
  });

  // ─── setDrawAnswer ────────────────────────────────────────────────────

  it('should set draw answer when no feedback', () => {
    const payload = { canvasMode: 'write' as any, canvasSize: { width: 100, height: 100 }, strokesByCharacter: [] };
    store.setDrawAnswer(payload);
    expect(store.drawAnswer()).toEqual(payload);
  });

  it('should clear draw answer when null is passed', () => {
    const payload = { canvasMode: 'write' as any, canvasSize: { width: 100, height: 100 }, strokesByCharacter: [] };
    store.setDrawAnswer(payload);
    store.setDrawAnswer(null);
    expect(store.drawAnswer()).toBeNull();
  });

  it('should not set draw answer when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    const payload = { canvasMode: 'write' as any, canvasSize: { width: 100, height: 100 }, strokesByCharacter: [] };
    store.setDrawAnswer(payload);
    expect(store.drawAnswer()).toBeNull();
  });

  // ─── handleTimeExpired ────────────────────────────────────────────────

  it('should set feedback to incorrect on time expired', () => {
    store.handleTimeExpired();
    expect(store.feedback()).toBe('incorrect');
  });

  it('should not set feedback on time expired when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.handleTimeExpired();
    expect(store.feedback()).toBe('correct');
  });

  it('should not set feedback on time expired when completed', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    store.handleTimeExpired();
    expect(store.feedback()).toBe('correct');
  });

  // ─── checkAnswer ──────────────────────────────────────────────────────

  it('should return null when no current card', () => {
    store.reset();
    expect(store.checkAnswer()).toBeNull();
  });

  it('should return true for correct answer', () => {
    store.selectOption(0);
    expect(store.checkAnswer()).toBe(true);
  });

  it('should return false for incorrect answer', () => {
    store.selectOption(1);
    expect(store.checkAnswer()).toBe(false);
  });

  it('should set feedback to correct', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.feedback()).toBe('correct');
  });

  it('should set feedback to incorrect', () => {
    store.selectOption(1);
    store.checkAnswer();
    expect(store.feedback()).toBe('incorrect');
  });

  // ─── nextCard ─────────────────────────────────────────────────────────

  it('should not advance when no feedback', () => {
    const initialIndex = store.currentIndex();
    store.nextCard();
    expect(store.currentIndex()).toBe(initialIndex);
  });

  it('should advance to next card', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    expect(store.currentIndex()).toBe(1);
    expect(store.currentCard()?.id).toBe('c2');
  });

  it('should reset interaction after advancing', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    expect(store.selectedIndex()).toBeNull();
    expect(store.answerText()).toBe('');
    expect(store.memoryComplete()).toBe(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
    expect(store.feedback()).toBeNull();
  });

  it('should mark as completed on last card', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    expect(store.completed()).toBe(true);
  });

  it('should not advance when already completed', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    const initialCompleted = store.completed();
    store.nextCard();
    expect(store.completed()).toBe(initialCompleted);
  });

  // ─── setSessionDirection ──────────────────────────────────────────────

  it('should change session direction', () => {
    store.setSessionDirection('learning-to-known');
    expect(store.sessionDirection()).toBe('learning-to-known');
  });

  it('should not change direction when same', () => {
    const initialDirection = store.sessionDirection();
    store.setSessionDirection(initialDirection);
    expect(store.sessionDirection()).toBe(initialDirection);
  });

  it('should reset interaction when direction changes', () => {
    store.selectOption(0);
    store.setSessionDirection('learning-to-known');
    expect(store.selectedIndex()).toBeNull();
    expect(store.answerText()).toBe('');
    expect(store.memoryComplete()).toBe(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
    expect(store.feedback()).toBeNull();
  });

  // ─── isLastCard ───────────────────────────────────────────────────────

  it('should return false when not on last card', () => {
    expect(store.isLastCard()).toBe(false);
  });

  it('should return true when on last card', () => {
    store.setScenario('scenario-1', [CARDS[0], CARDS[1], CARDS[2]]);
    store.currentIndex.set(2);
    expect(store.isLastCard()).toBe(true);
  });

  it('should return false when cards array is empty', () => {
    store.reset();
    expect(store.isLastCard()).toBe(false);
  });

  // ─── canCheckAnswer ───────────────────────────────────────────────────

  it('should return true when card exists and no feedback', () => {
    store.selectOption(0);
    expect(store.canCheckAnswer()).toBe(true);
  });

  it('should return false when feedback already shown', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.canCheckAnswer()).toBe(false);
  });

  it('should return false when completed', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    expect(store.canCheckAnswer()).toBe(false);
  });

  it('should return false when no current card', () => {
    store.reset();
    expect(store.canCheckAnswer()).toBe(false);
  });

  // ─── canGoNext ────────────────────────────────────────────────────────

  it('should return true when feedback exists and not completed', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.canGoNext()).toBe(true);
  });

  it('should return false when no feedback', () => {
    expect(store.canGoNext()).toBe(false);
  });

  it('should return false when completed', () => {
    store.setScenario('scenario-1', [CARDS[0]]);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    expect(store.canGoNext()).toBe(false);
  });

  // ─── progressLabel ────────────────────────────────────────────────────

  it('should show correct progress label', () => {
    expect(store.progressLabel()).toBe('1 / 3');
  });

  it('should show 0 / 0 when no cards', () => {
    store.reset();
    expect(store.progressLabel()).toBe('0 / 0');
  });

  // ─── card with memory kind ────────────────────────────────────────────

  it('should increment memoryBoardNonce when setting a new scenario with memory card', () => {
    store.setScenario('scenario-1', [CARDS[0], CARDS[1]]);
    const initialNonce = store.memoryBoardNonce();
    store.setScenario('scenario-2', [CARDS[2]]);
    expect(store.memoryBoardNonce()).toBe(initialNonce + 1);
  });

  // ─── reset ────────────────────────────────────────────────────────────

  it('should reset all state to initial values', () => {
    store.setScenario('scenario-1', CARDS);
    store.selectOption(0);
    store.checkAnswer();
    store.nextCard();
    store.setAnswerText('test');
    store.setLoading(true);
    store.setError('error');
    store.reset();

    expect(store.cards()).toEqual([]);
    expect(store.scenarioId()).toBe('demo-scenario');
    expect(store.sessionDirection()).toBe('known-to-learning');
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.currentIndex()).toBe(0);
    expect(store.selectedIndex()).toBeNull();
    expect(store.answerText()).toBe('');
    expect(store.memoryComplete()).toBe(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
    expect(store.feedback()).toBeNull();
    expect(store.completed()).toBe(false);
  });

  // ─── setScenario ──────────────────────────────────────────────────────

  it('should set scenario and reset interaction', () => {
    store.selectOption(0);
    store.checkAnswer();
    store.setScenario('scenario-2', [CARDS[1]]);
    expect(store.scenarioId()).toBe('scenario-2');
    expect(store.cards()).toEqual([CARDS[1]]);
    expect(store.selectedIndex()).toBeNull();
    expect(store.feedback()).toBeNull();
    expect(store.completed()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
