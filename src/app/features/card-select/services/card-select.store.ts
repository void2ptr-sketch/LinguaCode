import { Injectable, signal } from '@angular/core';
import { SelectCard } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class CardSelectStore {
  readonly cards = signal<readonly SelectCard[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setCards(cards: readonly SelectCard[]): void {
    this.cards.set(cards);
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

  reset(): void {
    this.cards.set([]);
    this.loading.set(false);
    this.error.set(null);
  }
}
