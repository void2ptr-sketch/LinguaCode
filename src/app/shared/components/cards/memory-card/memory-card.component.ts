import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { resolveMemoryPairs } from '../../../../core/data/card-direction.utils';
import { MemoryCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { PhoneticLexeme } from '../../../../core/models/phonetic-content.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';

export type MemoryColumnItem = {
  id: string;
  pairId: string;
  column: 'left' | 'right';
  label: string;
  lexeme?: PhoneticLexeme;
};

@Component({
  selector: 'app-memory-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, LexemeDisplayComponent],
  templateUrl: './memory-card.component.html',
  styleUrl: './memory-card.component.scss',
})
export class MemoryCardComponent {
  readonly card = input.required<MemoryCard>();
  readonly direction = input<CardDirection>('known-to-learning');
  /** Меняется при каждом повторном открытии карточки в сессии — запускает перемешивание. */
  readonly boardNonce = input(0);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly memoryComplete = output<boolean>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly leftItems = signal<readonly MemoryColumnItem[]>([]);
  readonly rightItems = signal<readonly MemoryColumnItem[]>([]);
  readonly selectedItemId = signal<string | null>(null);
  readonly matchedPairIds = signal<readonly string[]>([]);
  readonly mismatchItemIds = signal<readonly string[]>([]);

  readonly columnLabels = computed(() => {
    if (this.direction() === 'known-to-learning') {
      return { left: 'Известный', right: 'Новый' };
    }

    return { left: 'Новый', right: 'Известный' };
  });

  private mismatchTimerId: number | null = null;

  constructor() {
    effect(() => {
      this.card();
      this.direction();
      this.boardNonce();
      this.resetBoard();
    });
  }

  resetBoard(): void {
    this.clearMismatchTimer();
    const pairs = resolveMemoryPairs(this.card().pairs, this.direction());

    this.leftItems.set(
      this.shuffle(
        pairs.map((pair) => ({
          id: `${pair.pairId}-left`,
          pairId: pair.pairId,
          column: 'left' as const,
          label: pair.left,
          lexeme: pair.leftLexeme,
        })),
      ),
    );

    this.rightItems.set(
      this.shuffle(
        pairs.map((pair) => ({
          id: `${pair.pairId}-right`,
          pairId: pair.pairId,
          column: 'right' as const,
          label: pair.right,
          lexeme: pair.rightLexeme,
        })),
      ),
    );

    this.selectedItemId.set(null);
    this.matchedPairIds.set([]);
    this.mismatchItemIds.set([]);
  }

  selectItem(item: MemoryColumnItem): void {
    if (this.feedback() !== null || this.isMatched(item)) {
      return;
    }

    const selectedId = this.selectedItemId();
    if (!selectedId) {
      this.selectedItemId.set(item.id);
      return;
    }

    if (selectedId === item.id) {
      this.selectedItemId.set(null);
      return;
    }

    const selected = this.findItem(selectedId);
    if (!selected) {
      this.selectedItemId.set(item.id);
      return;
    }

    if (selected.column === item.column) {
      this.selectedItemId.set(item.id);
      return;
    }

    if (selected.pairId === item.pairId) {
      const nextMatched = [...this.matchedPairIds(), item.pairId];
      this.matchedPairIds.set(nextMatched);
      this.selectedItemId.set(null);
      this.mismatchItemIds.set([]);

      if (nextMatched.length === this.card().pairs.length) {
        this.memoryComplete.emit(true);
      }
      return;
    }

    this.selectedItemId.set(null);
    this.mismatchItemIds.set([selected.id, item.id]);
    this.clearMismatchTimer();
    this.mismatchTimerId = window.setTimeout(() => {
      this.mismatchItemIds.set([]);
      this.mismatchTimerId = null;
    }, 700);
  }

  isMatched(item: MemoryColumnItem): boolean {
    return this.matchedPairIds().includes(item.pairId);
  }

  isSelected(item: MemoryColumnItem): boolean {
    return this.selectedItemId() === item.id;
  }

  isMismatch(item: MemoryColumnItem): boolean {
    return this.mismatchItemIds().includes(item.id);
  }

  itemClass(item: MemoryColumnItem): string {
    const classes = ['memory-item'];
    if (this.isMatched(item)) {
      classes.push('memory-item--matched');
    }
    if (this.isSelected(item)) {
      classes.push('memory-item--selected');
    }
    if (this.isMismatch(item)) {
      classes.push('memory-item--mismatch');
    }
    return classes.join(' ');
  }

  private findItem(itemId: string): MemoryColumnItem | undefined {
    return (
      this.leftItems().find((item) => item.id === itemId) ??
      this.rightItems().find((item) => item.id === itemId)
    );
  }

  private clearMismatchTimer(): void {
    if (this.mismatchTimerId !== null) {
      window.clearTimeout(this.mismatchTimerId);
      this.mismatchTimerId = null;
    }
  }

  private shuffle<T>(items: readonly T[]): readonly T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }
}
