import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { resolveMemoryPairs } from '../../../../core/data/cards/card-direction.utils';
import { MemoryCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { PhoneticLexeme } from '../../../../core/models/phonetic-content.types';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * An item in a memory card column (left or right).
 *
 * @remarks
 * Used for pair-matching exercises where the user connects items from two columns.
 * Items are matched by `pairId` across columns.
 */
export type MemoryColumnItem = {
  /** Unique identifier for this item instance (includes column suffix). */
  id: string;
  /** The pair identifier used to match items across columns. */
  pairId: string;
  /** Which column this item belongs to. */
  column: 'left' | 'right';
  /** Display label for the item. */
  label: string;
  /** Optional lexeme data for CJK phonetic display. */
  lexeme?: PhoneticLexeme;
};

/**
 * UI component for memory card pair-matching exercises.
 *
 * @remarks
 * Renders two columns of items (known and learning). The user clicks items
 * to match pairs. Columns are randomized on each display via `boardNonce`.
 *
 * @example
 * ```html
 * <app-memory-card
 *   [card]="memoryCard"
 *   [direction]="'known-to-learning'"
 *   [boardNonce]="0"
 *   [feedback]="null"
 *   (memoryComplete)="onComplete($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-memory-card>
 * ```
 */
@Component({
  selector: 'app-memory-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './memory-card.component.html',
  styleUrl: './memory-card.component.scss',
})
export class MemoryCardComponent {
  /**
   * The memory card to display (pair matching exercise).
   * @remarks
   * Contains pairs of items to match between left and right columns.
   */
  readonly card = input.required<MemoryCard>();

  /**
   * Card direction: 'known-to-learning' or 'learning-to-known'.
   * @remarks
   * Determines which side shows known items and which shows learning items.
   */
  readonly direction = input<CardDirection>('known-to-learning');

  /**
   * Nonce incremented each time the card is shown fresh.
   *
   * @remarks
   * Triggers column randomization on memory cards to prevent memorizing column positions.
   * Changing this value resets the board.
   */
  readonly boardNonce = input(0);

  /**
   * Feedback state: 'correct', 'incorrect', or null.
   * @remarks
   * When set, disables further item selection and shows visual feedback.
   */
  readonly feedback = input<CardFeedback>(null);

  /**
   * Font size for card content: 'sm', 'md', or 'lg'.
   * @remarks Defaults to 'md'. Affects text and item sizing.
   */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Emits when the user completes the memory board.
   * @remarks Payload is `true` when all pairs have been matched.
   */
  readonly memoryComplete = output<boolean>();

  /**
   * Emits when the user requests answer checking.
   * @remarks
   * Triggered when the user clicks the check answer button.
   */
  readonly checkAnswer = output<void>();

  /**
   * Emits when the user advances to the next card.
   * @remarks
   * Triggered when the user clicks the next card button.
   */
  readonly nextCard = output<void>();

  /**
   * Left column items (shuffled).
   * @remarks
   * Populated from `card.pairs` on board reset. Each item has a unique ID and pair reference.
   */
  readonly leftItems = signal<readonly MemoryColumnItem[]>([]);

  /**
   * Right column items (shuffled).
   * @remarks
   * Populated from `card.pairs` on board reset. Each item has a unique ID and pair reference.
   */
  readonly rightItems = signal<readonly MemoryColumnItem[]>([]);

  /**
   * ID of the currently selected item.
   * @remarks
   * Null when no item is selected. Set when the user clicks an item.
   */
  readonly selectedItemId = signal<string | null>(null);

  /**
   * IDs of matched pairs.
   * @remarks
   * Grows as the user correctly matches items. When length equals `card.pairs.length`, the board is complete.
   */
  readonly matchedPairIds = signal<readonly string[]>([]);

  /**
   * IDs of items in mismatch state.
   * @remarks
   * Contains two item IDs when a mismatch is detected. Cleared after 700ms.
   */
  readonly mismatchItemIds = signal<readonly string[]>([]);

  /**
   * Labels for the left and right columns based on direction.
   * @remarks
   * In 'known-to-learning': left = "Известный", right = "Новый".
   * In 'learning-to-known': left = "Новый", right = "Известный".
   */
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

  /**
   * Resets the memory board to its initial state.
   *
   * @remarks
   * Clears mismatch timers, resolves pairs from the card, shuffles both columns,
   * and resets selection, matched pairs, and mismatch state signals.
   * Triggered whenever `card`, `direction`, or `boardNonce` changes.
   */
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

  /**
   * Handles selection of a memory column item.
   *
   * @param item - The memory column item to select.
   * @remarks
   * If no item is selected, marks this as the first selection.
   * If the same item is tapped again, deselects it.
   * If items from different columns are selected, checks for a matching pair.
   * Emits `memoryComplete` when all pairs are matched.
   */
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

  /**
   * Checks if an item has been matched.
   *
   * @param item - The memory column item to check.
   * @returns `true` if the item's pair has been matched.
   */
  isMatched(item: MemoryColumnItem): boolean {
    return this.matchedPairIds().includes(item.pairId);
  }

  /**
   * Checks if an item is currently selected.
   *
   * @param item - The memory column item to check.
   * @returns `true` if the item is the currently selected one.
   */
  isSelected(item: MemoryColumnItem): boolean {
    return this.selectedItemId() === item.id;
  }

  /**
   * Checks if an item is in a mismatch state.
   *
   * @param item - The memory column item to check.
   * @returns `true` if the item is highlighted as a mismatch.
   */
  isMismatch(item: MemoryColumnItem): boolean {
    return this.mismatchItemIds().includes(item.id);
  }

  /**
   * Returns the CSS class string for an item based on its state.
   *
   * @param item - The memory column item.
   * @returns Space-separated CSS class string.
   */
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
