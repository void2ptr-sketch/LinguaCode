import { Injectable, computed, signal } from '@angular/core';
import { SelectCard } from '../../../core/models';
import { CardSelectFeedback } from '../types';

@Injectable({ providedIn: 'root' })
export class CardSelectStore {
  readonly cards = signal<readonly SelectCard[]>([]);
  readonly scenarioId = signal<string>('demo-scenario');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentIndex = signal(0);
  readonly selectedIndex = signal<number | null>(null);
  readonly feedback = signal<CardSelectFeedback>(null);
  readonly completed = signal(false);

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

  readonly canCheckAnswer = computed(
    () => this.selectedIndex() !== null && this.feedback() === null && !this.completed(),
  );

  readonly canGoNext = computed(() => this.feedback() !== null && !this.completed());

  setScenario(scenarioId: string, cards: readonly SelectCard[]): void {
    this.scenarioId.set(scenarioId);
    this.cards.set(cards);
    this.currentIndex.set(0);
    this.selectedIndex.set(null);
    this.feedback.set(null);
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

  checkAnswer(): boolean | null {
    const card = this.currentCard();
    const selected = this.selectedIndex();

    if (!card || selected === null) {
      return null;
    }

    const isCorrect = selected === card.correctIndex;
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
    this.selectedIndex.set(null);
    this.feedback.set(null);
  }

  reset(): void {
    this.cards.set([]);
    this.scenarioId.set('demo-scenario');
    this.loading.set(false);
    this.error.set(null);
    this.currentIndex.set(0);
    this.selectedIndex.set(null);
    this.feedback.set(null);
    this.completed.set(false);
  }
}
