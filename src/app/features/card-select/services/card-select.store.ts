import { Injectable, computed, inject, signal } from '@angular/core';
import { Card } from '../../../core/models';
import { cardDefaultDirection } from '../../../core/repositories/cards/card-direction.utils';
import { HanziDataService } from '../../hanzi-practice/hanzi-data.service';
import type { CardDirection } from '../../../core/models/language-pair.types';
import { UserStore } from '../../../core/state';
import { canCheckCardAnswer, checkCardAnswer } from '../../../shared/utils/card-answer/card-answer.util';
import { CardFeedback } from '../../../shared/types';
import type { DrawAnswerPayload } from '../../../shared/types/draw-answer.types';

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

  /** Array of cards in the current session. */
  readonly cards = signal<readonly Card[]>([]);

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

  /** Index of the selected option (for multiple-choice cards). */
  readonly selectedIndex = signal<number | null>(null);

  /** Text answer entered by the user (for keyboard cards). */
  readonly answerText = signal('');

  /** Whether the user has completed the memory board. */
  readonly memoryComplete = signal(false);

  /** Whether the user has submitted a draw answer. */
  readonly drawSubmitted = signal(false);

  /** Submitted draw answer payload. */
  readonly drawAnswer = signal<DrawAnswerPayload | null>(null);

  /** Feedback state: correct, incorrect, or null (not yet checked). */
  readonly feedback = signal<CardFeedback>(null);

  /** Whether all cards in the session have been completed. */
  readonly completed = signal(false);
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
    const total = this.cards().length;
    if (total === 0) {
      return '0 / 0';
    }

    return `${this.currentIndex() + 1} / ${total}`;
  });

  /** Whether the current card is the last one in the session. */
  readonly isLastCard = computed(() => {
    const cards = this.cards();
    return cards.length > 0 && this.currentIndex() >= cards.length - 1;
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
   * @param cards - Array of cards for this session.
   */
  setScenario(scenarioId: string, cards: readonly Card[]): void {
    this.scenarioId.set(scenarioId);
    this.cards.set(cards);
    this.sessionDirection.set(cards[0] ? cardDefaultDirection(cards[0]) : 'known-to-learning');
    this.resetInteraction();
    this.completed.set(false);
    this.loading.set(false);
    this.error.set(null);
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
    * Sets the draw submission state.
    *
    * @remarks
    * No-op if feedback is already shown or the session is completed.
    * Clears `drawAnswer` when `value` is `false`.
    *
    * @param value - Whether the draw answer has been submitted.
    */
   setDrawSubmitted(value: boolean): void {
    if (this.feedback() !== null || this.completed()) {
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
   */
  nextCard(): void {
    if (this.feedback() === null) {
      return;
    }

    if (this.isLastCard()) {
      this.completed.set(true);
      return;
    }

    this.currentIndex.update((index) => index + 1);
    this.resetInteraction();
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
    this.cards.set([]);
    this.scenarioId.set('demo-scenario');
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
    this.drawSubmitted.set(false);
    this.drawAnswer.set(null);
    this.feedback.set(null);

    const card = this.cards()[this.currentIndex()];
    if (card?.kind === 'memory') {
      this.memoryBoardNonce.update((nonce) => nonce + 1);
    }
  }
}
