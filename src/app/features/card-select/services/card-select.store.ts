import { Injectable, computed, inject, signal } from '@angular/core';
import { Card } from '../../../core/models';
import { cardDefaultDirection } from '../../../core/data/card-direction.utils';
import { HanziDataService } from '../../../core/hanzi-engine/hanzi-data.service';
import type { CardDirection } from '../../../core/models/language-pair.types';
import { UserStore } from '../../../core/state';
import { canCheckCardAnswer, checkCardAnswer } from '../../../shared/utils/card-answer.utils';
import { CardFeedback } from '../../../shared/types';
import type { DrawAnswerPayload } from '../../../shared/types/draw-answer.types';

@Injectable({ providedIn: 'root' })
export class CardSelectStore {
  private readonly userStore = inject(UserStore);
  private readonly hanziData = inject(HanziDataService);

  readonly cards = signal<readonly Card[]>([]);
  readonly scenarioId = signal<string>('demo-scenario');
  readonly sessionDirection = signal<CardDirection>('known-to-learning');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentIndex = signal(0);
  readonly selectedIndex = signal<number | null>(null);
  readonly answerText = signal('');
  readonly memoryComplete = signal(false);
  readonly drawSubmitted = signal(false);
  readonly drawAnswer = signal<DrawAnswerPayload | null>(null);
  readonly feedback = signal<CardFeedback>(null);
  readonly completed = signal(false);
  /** Увеличивается при каждом «свежем» показе memory-карточки — для перемешивания колонок. */
  readonly memoryBoardNonce = signal(0);

  readonly currentCard = computed(() => {
    const cards = this.cards();
    const index = this.currentIndex();
    return cards[index] ?? null;
  });

  readonly progressLabel = computed(() => {
    const total = this.cards().length;
    if (total === 0) {
      return '0 / 0';
    }

    return `${this.currentIndex() + 1} / ${total}`;
  });

  readonly isLastCard = computed(() => {
    const cards = this.cards();
    return cards.length > 0 && this.currentIndex() >= cards.length - 1;
  });

  readonly canCheckAnswer = computed(() => {
    const card = this.currentCard();
    if (!card || this.feedback() !== null || this.completed()) {
      return false;
    }

    return canCheckCardAnswer(card, this.answerState());
  });

  readonly canGoNext = computed(() => this.feedback() !== null && !this.completed());

  setScenario(scenarioId: string, cards: readonly Card[]): void {
    this.scenarioId.set(scenarioId);
    this.cards.set(cards);
    this.sessionDirection.set(cards[0] ? cardDefaultDirection(cards[0]) : 'known-to-learning');
    this.resetInteraction();
    this.completed.set(false);
    this.loading.set(false);
    this.error.set(null);
  }

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

  selectOption(index: number): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.selectedIndex.set(index);
  }

  setAnswerText(value: string): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.answerText.set(value);
  }

  setMemoryComplete(value: boolean): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.memoryComplete.set(value);
  }

  setDrawSubmitted(value: boolean): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.drawSubmitted.set(value);
    if (!value) {
      this.drawAnswer.set(null);
    }
  }

  setDrawAnswer(payload: DrawAnswerPayload | null): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.drawAnswer.set(payload);
  }

  handleTimeExpired(): void {
    if (this.feedback() !== null || this.completed()) {
      return;
    }

    this.feedback.set('incorrect');
  }

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

  setSessionDirection(direction: CardDirection): void {
    if (direction === this.sessionDirection()) {
      return;
    }

    this.sessionDirection.set(direction);
    this.resetInteraction();
  }

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

    const card = this.cards()[this.currentIndex()];
    if (card?.kind === 'memory') {
      this.memoryBoardNonce.update((nonce) => nonce + 1);
    }
  }
}
