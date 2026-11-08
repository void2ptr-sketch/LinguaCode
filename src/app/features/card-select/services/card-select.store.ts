import { Injectable, computed, inject, signal } from '@angular/core';
import { Card } from '../../../entities/card/model';
import { cardDefaultDirection } from '../../../entities/card/utils/card-direction.utils';
import { HanziDataService } from '../../../entities/chinese/lib/services/hanzi-data.service';
import type { CardDirection } from '../../../entities/language-pair/model/language-pair.types';
import { UserStore } from '../../../entities/user/model/user.store';
import {
  canCheckCardAnswer,
  checkCardAnswer,
} from '../../../entities/card/lib/card-answer/card-answer.util';
import { CardFeedback } from '../../../entities/card/model/card-interaction.types';
import type { DrawAnswerPayload } from '../../../entities/chinese/model/draw-answer.types';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CardSelectService } from './card-select.service';

/**
 * Store for card selection and practice session state.
 *
 * @remarks
 * Manages the current card index, user answers, feedback state, and session completion.
 * Uses Angular Signals for reactive state. Integrates with `HanziDataService` for draw card evaluation.
 */
@Injectable({ providedIn: 'root' })
export class CardSelectStore {
  private readonly userStore = inject(UserStore);
  private readonly hanziData = inject(HanziDataService);
  private readonly logger = inject(AppLoggerService);
  private readonly cardSelectService = inject(CardSelectService);

  /** Array of cards in the current session. */
  readonly cards = signal<readonly Card[]>([]);

  /** All card IDs for the current scenario (used for pagination). */
  readonly allCardIds = signal<readonly string[]>([]);

  /** ID of the current scenario. */
  readonly scenarioId = signal<string>('demo-scenario');

  /** Direction of the current session (known→learning or learning→known). */
  readonly sessionDirection = signal<CardDirection>('known-to-learning');

  /** Loading state for card retrieval. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

  /** Zero-based index of the current card. */
  readonly currentIndex = signal(0);

  /** Current page index (0-based). Derived from `currentIndex` when advancing. */
  readonly currentPage = signal(0);

  /** Set of loaded page indices for caching. */
  readonly loadedPages = signal<Set<number>>(new Set());

  /** Number of cards per page. */
  readonly pageSize = 25;

  /** Page indices currently being loaded (deduplicates concurrent loads). */
  private readonly pendingPages = new Set<number>();

  /** Index of the selected option (for multiple-choice cards). */
  readonly selectedIndex = signal<number | null>(null);

  /** Text answer entered by the user (for keyboard cards). */
  readonly answerText = signal('');

  /** Whether the user has completed the memory board. */
  readonly memoryComplete = signal(false);

  /** Self-reported result for flip cards: `true` — knew, `false` — did not know, `null` — unknown. */
  readonly flipKnown = signal<boolean | null>(null);

  /** Whether the user has submitted a draw answer. */
  readonly drawSubmitted = signal(false);

  /** Submitted draw answer payload. */
  readonly drawAnswer = signal<DrawAnswerPayload | null>(null);

  /** Feedback state: correct, incorrect, or null (not yet checked). */
  readonly feedback = signal<CardFeedback>(null);

  /** Whether all cards in the session have been completed. */
  readonly completed = signal(false);

  /**
   * Nonce for deterministic option shuffling across all option-based cards.
   *
   * @remarks
   * Incremented when starting a new scenario to reshuffle all card options.
   * Remains stable during navigation within the same session.
   */
  readonly shuffleNonce = signal(0);

  /**
   * Nonce incremented each time a memory card is shown fresh.
   *
   * @remarks
   * Used to trigger column randomization on memory cards.
   */
  readonly memoryBoardNonce = signal(0);

  /** The currently displayed card (or null if out of bounds). */
  readonly currentCard = computed(() => {
    const cards = this.cards();
    const index = this.currentIndex();
    return cards[index] ?? null;
  });

  /** Human-readable progress label (e.g. "3 / 10"). */
  readonly progressLabel = computed(() => {
    const total = this.allCardIds().length;
    if (total === 0) {
      return '0 / 0';
    }

    return `${this.currentIndex() + 1} / ${total}`;
  });

  /** Whether the current card is the last one in the session. */
  readonly isLastCard = computed(() => {
    const allIds = this.allCardIds();
    if (allIds.length === 0) return false;

    return this.currentIndex() >= allIds.length - 1;
  });

  /** Whether the user can check their answer (card exists, feedback not shown, not completed). */
  readonly canCheckAnswer = computed(() => {
    const card = this.currentCard();
    if (!card || this.feedback() !== null || this.completed()) {
      return false;
    }

    return canCheckCardAnswer(card, this.answerState());
  });

  /** Whether the user can advance to the next card (feedback exists, not completed). */
  readonly canGoNext = computed(() => this.feedback() !== null && !this.completed());

  /**
   * Sets up a new card selection session.
   *
   * @param scenarioId - The scenario ID.
   * @param allCardIds - All card IDs for this scenario (used for pagination).
   * @returns Promise that resolves when the first page is loaded (never rejects).
   */
  setScenario(scenarioId: string, allCardIds: readonly string[]): Promise<void> {
    this.scenarioId.set(scenarioId);
    this.allCardIds.set(allCardIds);
    this.currentPage.set(0);
    this.cards.set([]);
    this.loadedPages.set(new Set());
    this.currentIndex.set(0);
    this.sessionDirection.set('known-to-learning');
    this.resetInteraction();
    this.completed.set(false);
    this.loading.set(false);
    this.error.set(null);
    this.shuffleNonce.update((n) => n + 1);

    // Asynchronously load the first page
    return this.loadPage(0)
      .then(() => {
        // Sync card-dependent context once the first card is loaded
        const firstCard = this.cards()[0];
        if (firstCard) {
          this.sessionDirection.set(cardDefaultDirection(firstCard));
          if (firstCard.kind === 'memory') {
            this.memoryBoardNonce.update((nonce) => nonce + 1);
          }
        }
      })
      .catch((error: unknown) => {
        this.logger.warn('CardSelect: failed to load first page', error);
      });
  }

  /**
   * Loads a page of cards by their IDs.
   *
   * @param pageIndex - The zero-based page index to load.
   * @param options - `background: true` skips the global loading state (for preloading).
   * @returns Promise that resolves when the page is loaded.
   */
  async loadPage(pageIndex: number, options: { background?: boolean } = {}): Promise<void> {
    // Already loaded or currently loading — skip to avoid duplicates
    if (this.loadedPages().has(pageIndex) || this.pendingPages.has(pageIndex)) {
      return;
    }

    this.pendingPages.add(pageIndex);
    const background = options.background === true;
    if (!background) {
      this.loading.set(true);
    }

    try {
      const allIds = this.allCardIds();
      const start = pageIndex * this.pageSize;
      const end = Math.min(start + this.pageSize, allIds.length);
      const pageIds = allIds.slice(start, end);

      if (pageIds.length === 0) {
        return;
      }

      const cards = await this.cardSelectService.loadPageByIds(pageIds);
      const newPages = new Set(this.loadedPages());
      newPages.add(pageIndex);
      this.loadedPages.set(newPages);
      // Append to the loaded set: `cards` accumulates pages as the user advances,
      // while `currentIndex` stays global across the whole scenario.
      this.cards.update((prev) => [...prev, ...cards]);
    } catch (error) {
      this.logger.error(`CardSelect: failed to load page ${pageIndex}`, error);
      if (!background) {
        this.setError('Не удалось загрузить карточки');
      }
    } finally {
      this.pendingPages.delete(pageIndex);
      if (!background) {
        this.loading.set(false);
      }
    }
  }

  /**
   * Preloads the next page in the background without blocking navigation.
   */
  preloadNext(): void {
    const nextPage = this.currentPage() + 1;
    if (!this.loadedPages().has(nextPage)) {
      this.loadPage(nextPage, { background: true }).catch((error: unknown) => {
        this.logger.warn('CardSelect: failed to preload next page', error);
      });
    }
  }

  /**
   * Sets the loading state.
   *
   * @remarks
   * Clears any existing error when loading starts.
   *
   * @param loading - Whether cards are being loaded.
   */
  setLoading(loading: boolean): void {
    this.loading.set(loading);
    if (loading) {
      this.error.set(null);
    }
  }

  /**
   * Sets an error message and stops loading.
   *
   * @param message - The error message.
   */
  setError(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }

  /**
   * Selects an option index for multiple-choice cards.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   *
   * @param index - The zero-based index of the selected option.
   */
  selectOption(index: number): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.selectedIndex.set(index);
  }

  /**
   * Sets the text answer for keyboard cards.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   *
   * @param value - The entered text.
   */
  setAnswerText(value: string): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.answerText.set(value);
  }

  /**
   * Marks the memory board as complete.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   *
   * @param value - Whether the memory board is complete.
   */
  setMemoryComplete(value: boolean): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.memoryComplete.set(value);
  }

  /**
   * Sets the self-reported result for flip cards.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   *
   * @param value - Whether the user knew the back side.
   */
  setFlipKnown(value: boolean): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.flipKnown.set(value);
  }

  /**
   * Sets the draw submission state.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   * Clears `drawAnswer` when `value` is `false`.
   *
   * @param value - Whether the draw answer has been submitted.
   */
  setDrawSubmitted(value: boolean): void {
    if (this.feedback() !== null) {
      return;
    }
    this.drawSubmitted.set(value);
    if (!value) {
      this.drawAnswer.set(null);
    }
  }

  /**
   * Sets the submitted draw answer payload.
   *
   * @remarks
   * No-op if feedback is already shown or the session is completed.
   *
   * @param payload - The draw answer payload, or null to clear.
   */
  setDrawAnswer(payload: DrawAnswerPayload | null): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.drawAnswer.set(payload);
  }

  /**
   * Marks the answer as incorrect due to time expiration.
   *
   * @remarks
   * Only applies to timed cards.
   */
  handleTimeExpired(): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.feedback.set('incorrect');
  }

  /**
   * Checks the current answer against the card's expected solution and sets feedback.
   *
   * @returns `true` if correct, `false` if incorrect, `null` if the answer cannot be evaluated.
   * @remarks
   * Evaluates the answer using `checkCardAnswer` utility with the current answer state
   * and session direction. Sets `feedback` signal to `'correct'` or `'incorrect'` on success.
   * Returns `null` when no current card exists or evaluation fails.
   */
  checkAnswer(): boolean | null {
    const card = this.currentCard();
    if (!card) {
      return null;
    }

    const isCorrect = checkCardAnswer(
      card,
      this.answerState(),
      this.sessionDirection(),
      (character) => this.hanziData.getCachedModel(character),
      this.shuffleNonce(),
    );
    if (isCorrect === null) {
      return null;
    }

    this.feedback.set(isCorrect ? 'correct' : 'incorrect');
    return isCorrect;
  }

  /**
   * Advances to the next card or marks the session as completed.
   *
   * @remarks
   * No-op if feedback has not been provided yet.
   * If the current card is the last one, sets `completed` to `true`.
   * Otherwise, increments `currentIndex` and resets the interaction state.
   * Automatically loads the next page when reaching the end of the current page.
   */
  async nextCard(): Promise<void> {
    if (this.feedback() === null) {
      return;
    }

    if (this.isLastCard()) {
      this.completed.set(true);
      return;
    }

    const newCurrentIndex = this.currentIndex() + 1;

    // Ensure the card at the new index is loaded (pages may be preloaded ahead)
    if (newCurrentIndex >= this.cards().length) {
      await this.loadPage(this.currentPage() + 1);

      // Page failed to load (error or empty) — stay on the current card
      if (newCurrentIndex >= this.cards().length) {
        return;
      }
    }

    this.currentIndex.set(newCurrentIndex);
    // The current page is the one containing the new index
    this.currentPage.set(Math.floor(newCurrentIndex / this.pageSize));
    this.resetInteraction();

    // Preload the next page in the background
    this.preloadNext();
  }

  /**
   * Changes the session direction and resets the current interaction.
   *
   * @remarks
   * No-op if the direction is unchanged. Resets all interaction state
   * (selection, answer, memory, draw, feedback).
   *
   * @param direction - The new card direction.
   */
  setSessionDirection(direction: CardDirection): void {
    if (direction === this.sessionDirection()) {
      return;
    }

    this.sessionDirection.set(direction);
    this.resetInteraction();
  }

  /**
   * Resets the store to its initial state.
   *
   * @remarks
   * Clears all cards, resets index to 0, clears interaction state (answer, feedback, selection),
   * and sets `completed` to `false`. The scenario ID reverts to `'demo-scenario'`
   * and session direction resets to `'known-to-learning'`.
   */
  reset(): void {
    this.allCardIds.set([]);
    this.cards.set([]);
    this.scenarioId.set('demo-scenario');
    this.currentPage.set(0);
    this.loadedPages.set(new Set());
    this.sessionDirection.set('known-to-learning');
    this.loading.set(false);
    this.error.set(null);
    this.currentIndex.set(0);
    this.resetInteraction();
    this.completed.set(false);
  }

  /**
   * Builds the current answer state object from all interaction signals.
   *
   * @returns The answer state with all interaction fields.
   * @private
   */
  private answerState() {
    return {
      selectedIndex: this.selectedIndex(),
      answerText: this.answerText(),
      memoryComplete: this.memoryComplete(),
      drawSubmitted: this.drawSubmitted(),
      drawAnswer: this.drawAnswer(),
      flipKnown: this.flipKnown(),
      learningProficiencyLevel: this.userStore.learningProficiencyLevel(),
    };
  }

  /**
   * Resets all interaction state (selection, answer, memory, draw, feedback).
   *
   * @remarks
   * Increments `memoryBoardNonce` if the current card is a memory card
   * to trigger column randomization.
   *
   * @private
   */
  private resetInteraction(): void {
    this.selectedIndex.set(null);
    this.answerText.set('');
    this.memoryComplete.set(false);
    this.flipKnown.set(null);
    this.drawSubmitted.set(false);
    this.drawAnswer.set(null);
    this.feedback.set(null);

    const card = this.cards()[this.currentIndex()];
    if (card?.kind === 'memory') {
      this.memoryBoardNonce.update((nonce) => nonce + 1);
    }
  }
}
