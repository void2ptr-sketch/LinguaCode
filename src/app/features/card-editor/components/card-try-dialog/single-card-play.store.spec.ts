import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Card } from '../../../../entities/card/model';
import { HanziDataService } from '../../../../entities/chinese/lib/services/hanzi-data.service';
import { UserStore } from '../../../../entities/user/model/user.store';
import { SingleCardPlayStore } from './single-card-play.store';

const SELECT_CARD: Card = {
  id: 'c1',
  kind: 'select',
  title: 'Test',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Q?',
  optionsLearning: ['A', 'B'],
  correctIndex: 0,
};

describe('SingleCardPlayStore', () => {
  let store: SingleCardPlayStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SingleCardPlayStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: UserStore,
          useValue: { learningProficiencyLevel: vi.fn(() => 'intermediate' as never) },
        },
        {
          provide: HanziDataService,
          useValue: { getCachedModel: vi.fn(() => null) },
        },
      ],
    });
    store = TestBed.inject(SingleCardPlayStore);
    store.setCard(SELECT_CARD);
  });

  // ── Loading & Error ──

  it('should set loading state and clear error', () => {
    store.setError('previous error');
    expect(store.error()).toBe('previous error');

    store.setLoading(true);

    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('should set error and stop loading', () => {
    store.setLoading(true);
    expect(store.loading()).toBe(true);

    store.setError('something went wrong');

    expect(store.error()).toBe('something went wrong');
    expect(store.loading()).toBe(false);
  });

  // ── setCard ──

  it('should set card and reset interaction state', () => {
    store.selectOption(0);
    store.setAnswerText('test');
    store.setMemoryComplete(true);

    store.setCard(SELECT_CARD);

    expect(store.card()).toBe(SELECT_CARD);
    expect(store.feedback()).toBeNull();
    expect(store.selectedIndex()).toBeNull();
    expect(store.answerText()).toBe('');
    expect(store.memoryComplete()).toBe(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
  });

  it('should bump host key when card is set', () => {
    const keyBefore = store.hostKey();
    store.setCard(SELECT_CARD);
    expect(store.hostKey()).toBe(keyBefore + 1);
  });

  it('should clear error when card is set', () => {
    store.setError('old error');
    store.setCard(SELECT_CARD);
    expect(store.error()).toBeNull();
  });

  it('should set loading to false when card is set', () => {
    store.setLoading(true);
    store.setCard(SELECT_CARD);
    expect(store.loading()).toBe(false);
  });

  // ── selectOption ──

  it('should select an option index', () => {
    store.selectOption(1);
    expect(store.selectedIndex()).toBe(1);
  });

  it('should not allow selecting after feedback', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.feedback()).toBe('correct');

    store.selectOption(1);
    expect(store.selectedIndex()).toBe(0);
  });

  // ── setAnswerText ──

  it('should set text answer', () => {
    store.setAnswerText('pingyin');
    expect(store.answerText()).toBe('pingyin');
  });

  it('should not allow setting answer after feedback', () => {
    store.setAnswerText('pingyin');
    store.selectOption(0);
    store.checkAnswer();

    store.setAnswerText('new answer');
    expect(store.answerText()).toBe('pingyin');
  });

  // ── setMemoryComplete ──

  it('should mark memory board as complete', () => {
    store.setMemoryComplete(true);
    expect(store.memoryComplete()).toBe(true);
  });

  it('should not allow setting memory complete after feedback', () => {
    store.setMemoryComplete(true);
    store.selectOption(0);
    store.checkAnswer();

    store.setMemoryComplete(false);
    expect(store.memoryComplete()).toBe(true);
  });

  // ── setDrawSubmitted / setDrawAnswer ──

  it('should set draw submitted state', () => {
    store.setDrawSubmitted(true);
    expect(store.drawSubmitted()).toBe(true);
  });

  it('should clear draw answer when submission is reset', () => {
    store.setDrawSubmitted(true);
    store.setDrawAnswer({ strokes: [], character: '画' } as never);
    expect(store.drawAnswer()).not.toBeNull();

    store.setDrawSubmitted(false);
    expect(store.drawAnswer()).toBeNull();
  });

  it('should not allow setting draw submitted after feedback', () => {
    store.setDrawSubmitted(true);
    store.selectOption(0);
    store.checkAnswer();

    store.setDrawSubmitted(false);
    expect(store.drawSubmitted()).toBe(true);
  });

  it('should set draw answer payload', () => {
    const payload = { strokes: [], character: '画' } as never;
    store.setDrawAnswer(payload);
    expect(store.drawAnswer()).toBe(payload);
  });

  it('should clear draw answer when set to null', () => {
    const payload = { strokes: [], character: '画' } as never;
    store.setDrawAnswer(payload);
    store.setDrawAnswer(null);
    expect(store.drawAnswer()).toBeNull();
  });

  it('should not allow setting draw answer after feedback', () => {
    store.setDrawAnswer({ strokes: [], character: '画' } as never);
    store.selectOption(0);
    store.checkAnswer();

    store.setDrawAnswer(null);
    expect(store.drawAnswer()).not.toBeNull();
  });

  // ── handleTimeExpired ──

  it('should mark answer as incorrect on time expired', () => {
    store.handleTimeExpired();
    expect(store.feedback()).toBe('incorrect');
  });

  it('should not allow time expired after feedback already set', () => {
    store.handleTimeExpired();
    expect(store.feedback()).toBe('incorrect');

    store.handleTimeExpired();
    expect(store.feedback()).toBe('incorrect');
  });

  // ── checkAnswer ──

  it('should return true for correct select answer', () => {
    store.selectOption(0);
    const result = store.checkAnswer();
    expect(result).toBe(true);
    expect(store.feedback()).toBe('correct');
  });

  it('should return false for incorrect select answer', () => {
    store.selectOption(1);
    const result = store.checkAnswer();
    expect(result).toBe(false);
    expect(store.feedback()).toBe('incorrect');
  });

  it('should return null when no card is set', () => {
    store.card.set(null);
    const result = store.checkAnswer();
    expect(result).toBeNull();
  });

  it('should not change feedback when checkAnswer returns null', () => {
    // card without options that can't be checked
    store.card.set(null);
    store.checkAnswer();
    expect(store.feedback()).toBeNull();
  });

  // ── setSessionDirection ──

  it('should change session direction and reset interaction', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.feedback()).toBe('correct');

    store.setSessionDirection('learning-to-known');

    expect(store.sessionDirection()).toBe('learning-to-known');
    expect(store.feedback()).toBeNull();
    expect(store.selectedIndex()).toBeNull();
  });

  it('should not change direction when same value is set', () => {
    store.setSessionDirection('known-to-learning');
    expect(store.sessionDirection()).toBe('known-to-learning');
  });

  // ── tryAgain ──

  it('should reset interaction and bump host key', () => {
    store.selectOption(0);
    store.checkAnswer();
    const keyBefore = store.hostKey();

    store.tryAgain();

    expect(store.feedback()).toBeNull();
    expect(store.selectedIndex()).toBeNull();
    expect(store.hostKey()).toBe(keyBefore + 1);
  });

  // ── canCheckAnswer computed ──

  it('should be false when card is null', () => {
    store.card.set(null);
    expect(store.canCheckAnswer()).toBe(false);
  });

  it('should be false when feedback is already set', () => {
    store.selectOption(0);
    store.checkAnswer();
    expect(store.canCheckAnswer()).toBe(false);
  });

  it('should be true when card is set and no feedback', () => {
    expect(store.canCheckAnswer()).toBe(false); // no answer yet
    store.selectOption(0);
    expect(store.canCheckAnswer()).toBe(true);
  });

  // ── answerState ──

  it('should return correct answer state object', () => {
    store.selectOption(1);
    store.setAnswerText('test');
    store.setMemoryComplete(true);
    store.setDrawSubmitted(true);

    // answerState is private, but we can verify its effects via checkAnswer
    // The state includes: selectedIndex, answerText, memoryComplete, drawSubmitted, drawAnswer, learningProficiencyLevel
    expect(store.selectedIndex()).toBe(1);
    expect(store.answerText()).toBe('test');
    expect(store.memoryComplete()).toBe(true);
    expect(store.drawSubmitted()).toBe(true);
  });

  // ── resetInteraction ──

  it('should reset all interaction state', () => {
    store.selectOption(0);
    store.setAnswerText('test');
    store.setMemoryComplete(true);
    store.setDrawSubmitted(true);
    store.setDrawAnswer({ strokes: [], character: '画' } as never);
    store.checkAnswer();

    store.tryAgain();

    expect(store.selectedIndex()).toBeNull();
    expect(store.answerText()).toBe('');
    expect(store.memoryComplete()).toBe(false);
    expect(store.drawSubmitted()).toBe(false);
    expect(store.drawAnswer()).toBeNull();
    expect(store.feedback()).toBeNull();
  });
});
