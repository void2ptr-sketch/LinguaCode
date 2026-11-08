import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Card } from '../../../entities/card/model';
import { CardSelectStore } from './card-select.store';
import { CardSelectService } from './card-select.service';
import { resolveOptionCard } from '../../../entities/card/utils/card-direction.utils';

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

const CARD_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((card) => [card.id, card]));

/** Builds a self-reported flip card for pagination tests (easy to advance). */
const makeFlipCard = (id: string): Card => ({
  id,
  kind: 'flip',
  title: `Flip ${id}`,
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  front: 'Front',
  back: 'Back',
});

describe('CardSelectStore', () => {
  let store: CardSelectStore;
  /** Index of the correct option for the first card after deterministic shuffle. */
  let correctOptionIndex: number;
  /** Mock for CardSelectService.loadPageByIds. */
  let loadPageByIds: ReturnType<typeof vi.fn>;

  /** Starts a scenario and waits for the first page to be loaded. */
  async function startScenario(scenarioId: string, ids: readonly string[]): Promise<void> {
    await store.setScenario(scenarioId, ids);
  }

  beforeEach(() => {
    loadPageByIds = vi
      .fn()
      .mockImplementation(async (ids: readonly string[]) => ids.map((id) => CARD_BY_ID[id]));

    TestBed.configureTestingModule({
      providers: [{ provide: CardSelectService, useValue: { loadPageByIds: loadPageByIds } }],
    });
    store = TestBed.inject(CardSelectStore);
    correctOptionIndex = 0;
  });

  /** Sets up the default 3-card scenario and computes the shuffled correct option index. */
  async function setupDefaultScenario(): Promise<void> {
    await startScenario('scenario-1', ['c1', 'c2', 'c3']);
    // Set deterministic shuffle nonce for reproducible tests
    store.shuffleNonce.set(0);
    const firstCard = CARDS[0] as Extract<Card, { kind: 'select' }>;
    const resolved = resolveOptionCard(firstCard, 'known-to-learning', 0);
    correctOptionIndex = resolved.correctIndex;
  }

  describe('basic session flow', () => {
    beforeEach(async () => {
      await setupDefaultScenario();
    });

    it('should expose current card and progress', () => {
      expect(store.currentCard()?.id).toBe('c1');
      expect(store.progressLabel()).toBe('1 / 3');
    });

    it('should check select answer and move to next card', () => {
      store.selectOption(correctOptionIndex);
      expect(store.checkAnswer()).toBe(true);
      expect(store.feedback()).toBe('correct');

      store.nextCard();
      expect(store.currentCard()?.id).toBe('c2');
      expect(store.feedback()).toBeNull();
    });

    it('should check keyboard answer', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.nextCard();
      store.setAnswerText('hi');
      expect(store.checkAnswer()).toBe(true);
    });

    it('should complete scenario on last card', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();

      expect(store.completed()).toBe(true);
    });

    it('should reset to initial state', () => {
      store.setLoading(true);
      store.selectOption(correctOptionIndex);
      store.reset();

      expect(store.cards()).toEqual([]);
      expect(store.allCardIds()).toEqual([]);
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
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.selectOption(1);
      expect(store.selectedIndex()).toBe(correctOptionIndex);
    });

    it('should not select option when completed', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
      store.selectOption(1);
      expect(store.selectedIndex()).toBe(correctOptionIndex);
    });

    // ─── setAnswerText ────────────────────────────────────────────────────

    it('should set answer text when no feedback', () => {
      store.setAnswerText('hello');
      expect(store.answerText()).toBe('hello');
    });

    it('should not set answer text when feedback already shown', () => {
      store.selectOption(correctOptionIndex);
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
      store.selectOption(correctOptionIndex);
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
      const payload = {
        canvasMode: 'memory' as const,
        canvasSize: { width: 100, height: 100 },
        strokesByCharacter: [],
      };
      store.setDrawAnswer(payload);
      store.setDrawSubmitted(false);
      expect(store.drawSubmitted()).toBe(false);
      expect(store.drawAnswer()).toBeNull();
    });

    it('should not set draw submitted when feedback already shown', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.setDrawSubmitted(true);
      expect(store.drawSubmitted()).toBe(false);
    });

    // ─── setDrawAnswer ────────────────────────────────────────────────────

    it('should set draw answer when no feedback', () => {
      const payload = {
        canvasMode: 'memory' as const,
        canvasSize: { width: 100, height: 100 },
        strokesByCharacter: [],
      };
      store.setDrawAnswer(payload);
      expect(store.drawAnswer()).toEqual(payload);
    });

    it('should clear draw answer when null is passed', () => {
      const payload = {
        canvasMode: 'memory' as const,
        canvasSize: { width: 100, height: 100 },
        strokesByCharacter: [],
      };
      store.setDrawAnswer(payload);
      store.setDrawAnswer(null);
      expect(store.drawAnswer()).toBeNull();
    });

    it('should not set draw answer when feedback already shown', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      const payload = {
        canvasMode: 'memory' as const,
        canvasSize: { width: 100, height: 100 },
        strokesByCharacter: [],
      };
      store.setDrawAnswer(payload);
      expect(store.drawAnswer()).toBeNull();
    });

    // ─── handleTimeExpired ────────────────────────────────────────────────

    it('should set feedback to incorrect on time expired', () => {
      store.handleTimeExpired();
      expect(store.feedback()).toBe('incorrect');
    });

    it('should not set feedback on time expired when feedback already shown', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.handleTimeExpired();
      expect(store.feedback()).toBe('correct');
    });

    it('should not set feedback on time expired when completed', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
      store.handleTimeExpired();
      expect(store.feedback()).toBe('correct');
    });

    // ─── checkAnswer ──────────────────────────────────────────────────────

    it('should return null when no current card', () => {
      store.reset();
      expect(store.checkAnswer()).toBeNull();
    });

    it('should return true for correct answer', () => {
      store.selectOption(correctOptionIndex);
      expect(store.checkAnswer()).toBe(true);
    });

    it('should return false for incorrect answer', () => {
      const wrongIndex = correctOptionIndex === 0 ? 1 : 0;
      store.selectOption(wrongIndex);
      expect(store.checkAnswer()).toBe(false);
    });

    it('should set feedback to correct', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      expect(store.feedback()).toBe('correct');
    });

    it('should set feedback to incorrect', () => {
      const wrongIndex = correctOptionIndex === 0 ? 1 : 0;
      store.selectOption(wrongIndex);
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
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.nextCard();
      expect(store.currentIndex()).toBe(1);
      expect(store.currentCard()?.id).toBe('c2');
    });

    it('should reset interaction after advancing', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.nextCard();
      expect(store.selectedIndex()).toBeNull();
      expect(store.answerText()).toBe('');
      expect(store.memoryComplete()).toBe(false);
      expect(store.drawSubmitted()).toBe(false);
      expect(store.drawAnswer()).toBeNull();
      expect(store.feedback()).toBeNull();
    });

    it('should mark as completed on last card', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
      expect(store.completed()).toBe(true);
    });

    it('should not advance when already completed', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
      const initialCompleted = store.completed();
      await store.nextCard();
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
      store.selectOption(correctOptionIndex);
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
      store.currentIndex.set(2);
      expect(store.isLastCard()).toBe(true);
    });

    it('should return false when cards array is empty', () => {
      store.reset();
      expect(store.isLastCard()).toBe(false);
    });

    it('should return true on last card of a small (sub-page) scenario', async () => {
      // Regression: scenarios smaller than one page must still complete.
      await startScenario('scenario-1', ['c1']);
      store.currentIndex.set(0);
      expect(store.isLastCard()).toBe(true);
    });

    // ─── canCheckAnswer ───────────────────────────────────────────────────

    it('should return true when card exists and no feedback', () => {
      store.selectOption(correctOptionIndex);
      expect(store.canCheckAnswer()).toBe(true);
    });

    it('should return false when feedback already shown', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      expect(store.canCheckAnswer()).toBe(false);
    });

    it('should return false when completed', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
      expect(store.canCheckAnswer()).toBe(false);
    });

    it('should return false when no current card', () => {
      store.reset();
      expect(store.canCheckAnswer()).toBe(false);
    });

    // ─── canGoNext ────────────────────────────────────────────────────────

    it('should return true when feedback exists and not completed', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      expect(store.canGoNext()).toBe(true);
    });

    it('should return false when no feedback', () => {
      expect(store.canGoNext()).toBe(false);
    });

    it('should return false when completed', async () => {
      await startScenario('scenario-1', ['c1']);
      store.shuffleNonce.set(0);
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await store.nextCard();
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

    it('should increment memoryBoardNonce when setting a new scenario with memory card', async () => {
      await startScenario('scenario-1', ['c1', 'c2']);
      const initialNonce = store.memoryBoardNonce();
      await startScenario('scenario-2', ['c3']);
      expect(store.memoryBoardNonce()).toBe(initialNonce + 1);
    });

    // ─── reset ────────────────────────────────────────────────────────────

    it('should reset all state to initial values', () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      store.nextCard();
      store.setAnswerText('test');
      store.setLoading(true);
      store.setError('error');
      store.reset();

      expect(store.cards()).toEqual([]);
      expect(store.allCardIds()).toEqual([]);
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

    it('should set scenario and reset interaction', async () => {
      store.selectOption(correctOptionIndex);
      store.checkAnswer();
      await startScenario('scenario-2', ['c2']);
      expect(store.scenarioId()).toBe('scenario-2');
      expect(store.cards()).toEqual([CARDS[1]]);
      expect(store.selectedIndex()).toBeNull();
      expect(store.feedback()).toBeNull();
      expect(store.completed()).toBe(false);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should set session direction from the first loaded card', async () => {
      await startScenario('scenario-1', ['c2']);
      expect(store.sessionDirection()).toBe('known-to-learning');
    });
  });

  // ─── Pagination ─────────────────────────────────────────────────────────

  describe('pagination', () => {
    /** Scenario of 5 flip cards with pageSize=2. */
    const PAGE_IDS: readonly string[] = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const PAGE_CARD_BY_ID: Record<string, Card> = Object.fromEntries(
      PAGE_IDS.map((id) => [id, makeFlipCard(id)]),
    );

    beforeEach(async () => {
      loadPageByIds.mockImplementation(async (ids: readonly string[]) =>
        ids.map((id) => PAGE_CARD_BY_ID[id]),
      );
      // Shrink page size for testable page boundaries (readonly is TS-only)
      (store as unknown as { pageSize: number }).pageSize = 2;
      await startScenario('scenario-1', PAGE_IDS);
    });

    it('should load only the first page on setScenario', () => {
      expect(store.cards().length).toBe(2);
      expect(store.allCardIds().length).toBe(5);
      expect(store.currentPage()).toBe(0);
      expect(store.loadedPages()).toEqual(new Set([0]));
      expect(store.progressLabel()).toBe('1 / 5');
    });

    it('should load next page when advancing past the page boundary', async () => {
      // Answer and advance through both cards of page 0
      for (let index = 0; index < 2; index += 1) {
        store.setFlipKnown(true);
        store.checkAnswer();
        await store.nextCard();
      }

      expect(store.currentIndex()).toBe(2);
      expect(store.currentPage()).toBe(1);
      // Page 1 is loaded; page 2 may already be preloaded in the background
      expect(store.cards().length).toBeGreaterThanOrEqual(4);
      expect(store.loadedPages().has(1)).toBe(true);
      expect(store.currentCard()?.id).toBe('p3');
    });

    it('should complete session after traversing all pages', async () => {
      for (let index = 0; index < 5; index += 1) {
        store.setFlipKnown(true);
        store.checkAnswer();
        await store.nextCard();
      }

      expect(store.completed()).toBe(true);
    });

    it('should not mark last card before the final page', () => {
      store.currentIndex.set(1);
      expect(store.isLastCard()).toBe(false);
      store.currentIndex.set(4);
      expect(store.isLastCard()).toBe(true);
    });

    it('should preload next page in the background', async () => {
      store.preloadNext();
      await vi.waitFor(() => {
        expect(store.loadedPages().has(1)).toBe(true);
      });
      expect(store.cards().length).toBe(4);
      // Preloading must not move the user forward
      expect(store.currentIndex()).toBe(0);
    });

    it('should not reload already loaded pages', async () => {
      const callsBefore = loadPageByIds.mock.calls.length;
      await store.loadPage(0);
      expect(loadPageByIds.mock.calls.length).toBe(callsBefore);
    });

    it('should accumulate pages without duplicating cards', async () => {
      await store.loadPage(1);
      const cardIds = store.cards().map((card) => card.id);
      expect(cardIds).toEqual(['p1', 'p2', 'p3', 'p4']);
    });

    it('should set error and stay on current card when page loading fails', async () => {
      // Jump to the end of page 0, then fail loading page 1
      loadPageByIds.mockRejectedValueOnce(new Error('network down'));

      store.setFlipKnown(true);
      store.checkAnswer();
      store.currentIndex.set(1);
      await store.nextCard();

      expect(store.error()).toBe('Не удалось загрузить карточки');
      expect(store.currentIndex()).toBe(1);
      expect(store.currentCard()?.id).toBe('p2');
    });
  });
});
