import { Injectable, computed, signal } from '@angular/core';
import { Card } from '../../../../core/models';
import { cardDefaultDirection } from '../../../../core/data/card-direction.utils';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { canCheckCardAnswer, checkCardAnswer } from '../../../../shared/utils/card-answer.utils';
import { CardFeedback } from '../../../../shared/types';

@Injectable()
export class SingleCardPlayStore {
  readonly card = signal<Card | null>(null);
  readonly sessionDirection = signal<CardDirection>('known-to-learning');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hostKey = signal(0);
  readonly selectedIndex = signal<number | null>(null);
  readonly answerText = signal('');
  readonly memoryComplete = signal(false);
  readonly drawSubmitted = signal(false);
  readonly feedback = signal<CardFeedback>(null);

  readonly canCheckAnswer = computed(() => {
    const card = this.card();
    if (!card || this.feedback() !== null) {
      return false;
    }

    return canCheckCardAnswer(card, this.answerState());
  });

  setLoading(loading: boolean): void {
    this.loading.set(loading);
    if (loading) {
      this.error.set(null);
    }
  }

  setError(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }

  setCard(card: Card): void {
    this.card.set(card);
    this.sessionDirection.set(cardDefaultDirection(card));
    this.loading.set(false);
    this.error.set(null);
    this.resetInteraction();
    this.bumpHostKey();
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.selectedIndex.set(index);
  }

  setAnswerText(value: string): void {
    if (this.feedback() !== null) {
      return;
    }

    this.answerText.set(value);
  }

  setMemoryComplete(value: boolean): void {
    if (this.feedback() !== null) {
      return;
    }

    this.memoryComplete.set(value);
  }

  setDrawSubmitted(value: boolean): void {
    if (this.feedback() !== null) {
      return;
    }

    this.drawSubmitted.set(value);
  }

  handleTimeExpired(): void {
    if (this.feedback() !== null) {
      return;
    }

    this.feedback.set('incorrect');
  }

  checkAnswer(): boolean | null {
    const card = this.card();
    if (!card) {
      return null;
    }

    const isCorrect = checkCardAnswer(card, this.answerState(), this.sessionDirection());
    if (isCorrect === null) {
      return null;
    }

    this.feedback.set(isCorrect ? 'correct' : 'incorrect');
    return isCorrect;
  }

  setSessionDirection(direction: CardDirection): void {
    if (direction === this.sessionDirection()) {
      return;
    }

    this.sessionDirection.set(direction);
    this.tryAgain();
  }

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
    };
  }

  private resetInteraction(): void {
    this.selectedIndex.set(null);
    this.answerText.set('');
    this.memoryComplete.set(false);
    this.drawSubmitted.set(false);
    this.feedback.set(null);
  }
}
