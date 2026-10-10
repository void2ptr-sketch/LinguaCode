import { Injectable, computed, inject, signal } from '@angular/core';
import { Card } from '../../../../core/models';
import { cardDefaultDirection } from '../../../../core/repositories/cards/utils/card-direction.utils';
import { HanziDataService } from '../../../hanzi-practice/services/hanzi-data.service';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { UserStore } from '../../../../core/state';
import { canCheckCardAnswer, checkCardAnswer } from '../../../../shared/utils/card-answer/card-answer.util';
import { CardFeedback } from '../../../../shared/types';
import type { DrawAnswerPayload } from '../../../../shared/types/draw-answer.types';

/**
 * Store for single-card practice sessions in the "try" dialog.
 *
 * @remarks
 * Manages card display, answer checking, and feedback state for
 * individual card practice. Uses Angular Signals for reactive state.
 */
@Injectable()
export class SingleCardPlayStore {
  private readonly userStore = inject(UserStore);
  private readonly hanziData = inject(HanziDataService);

  /** The card currently being practiced. */
  readonly card = signal<Card | null>(null);

  /** Direction of practice (known→learning or learning→known). */
  readonly sessionDirection = signal<CardDirection>('known-to-learning');

  /** Loading state. */
  readonly loading = signal(false);

  /** Error message, if any. */
  readonly error = signal<string | null>(null);

  /** Nonce for forcing host component re-render. */
  readonly hostKey = signal(0);

  /** Index of the selected option (for multiple-choice cards). */
  readonly selectedIndex = signal<number | null>(null);

  /** Text answer entered by the user. */
  readonly answerText = signal('');

  /** Whether the user has completed the memory board. */
  readonly memoryComplete = signal(false);

  /** Whether the user has submitted a draw answer. */
  readonly drawSubmitted = signal(false);

  /** Submitted draw answer payload. */
  readonly drawAnswer = signal<DrawAnswerPayload | null>(null);

  /** Answer feedback: 'correct', 'incorrect', or null (not yet checked). */
  readonly feedback = signal<CardFeedback>(null);

  /** Whether the user can submit their answer. */
  readonly canCheckAnswer = computed(() => {
    const card = this.card();
    if (!card || this.feedback() !== null) {
      return false;
    }

    return canCheckCardAnswer(card, this.answerState());
  });

  /**
   * Sets the loading state.
   *
   * @param loading - Whether the card is being loaded.
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
   * Sets the card and resets interaction state.
   *
   * @param card - The card to practice.
   */
  setCard(card: Card): void {
    this.card.set(card);
    this.sessionDirection.set(cardDefaultDirection(card));
    this.loading.set(false);
    this.error.set(null);
    this.resetInteraction();
    this.bumpHostKey();
  }

  /**
   * Selects an option index for multiple-choice cards.
   *
   * @param index - The zero-based index of the selected option.
   */
  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.selectedIndex.set(index);
  }

  /**
   * Sets the text answer for keyboard cards.
   *
   * @param value - The entered text.
   */
  setAnswerText(value: string): void {
    if (this.feedback() !== null) {
      return;
    }

    this.answerText.set(value);
  }

  /**
   * Marks the memory board as complete.
   *
   * @param value - Whether the memory board is complete.
   */
  setMemoryComplete(value: boolean): void {
    if (this.feedback() !== null) {
      return;
    }

    this.memoryComplete.set(value);
  }

  /**
   * Sets the draw submission state.
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
   * @param payload - The draw answer payload, or null to clear.
   */
  setDrawAnswer(payload: DrawAnswerPayload | null): void {
    if (this.feedback() !== null) {
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
    if (this.feedback() !== null) {
      return;
    }

    this.feedback.set('incorrect');
  }

  /**
   * Checks the current answer and sets feedback.
   *
   * @returns `true` if correct, `false` if incorrect, `null` if answer cannot be evaluated.
   */
  checkAnswer(): boolean | null {
    const card = this.card();
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
   * Changes the session direction and resets the current interaction.
   *
   * @param direction - The new card direction.
   */
  setSessionDirection(direction: CardDirection): void {
    if (direction === this.sessionDirection()) {
      return;
    }

    this.sessionDirection.set(direction);
    this.tryAgain();
  }

  /**
   * Resets the current interaction for retry.
   */
  tryAgain(): void {
    this.resetInteraction();
    this.bumpHostKey();
  }

  private bumpHostKey(): void {
    this.hostKey.update((key) => key + 1);
  }

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

  private resetInteraction(): void {
    this.selectedIndex.set(null);
    this.answerText.set('');
    this.memoryComplete.set(false);
    this.drawSubmitted.set(false);
    this.drawAnswer.set(null);
    this.feedback.set(null);
  }
}
