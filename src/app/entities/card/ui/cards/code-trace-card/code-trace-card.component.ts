import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { resolveOptionCard } from '../../../utils/card-direction.utils';
import { CodeTraceCard } from '../../../model';
import { CardFeedback } from '../../../model/card-interaction.types';
import { buildOptionClass } from '../../../lib/cards/option-card.util';
import { CodeHighlightComponent } from '../../code-highlight/code-highlight.component';

/**
 * Code-trace card: user predicts the output of a code snippet.
 *
 * @remarks
 * Displays a code block with a question («Что выведет код?») and a list of
 * possible outputs. Reuses `CodeHighlightComponent` for syntax highlighting
 * and `buildOptionClass` for option styling.
 *
 * @example
 * ```html
 * <app-code-trace-card
 *   [card]="codeTraceCard"
 *   [selectedIndex]="selectedIndex()"
 *   [feedback]="feedback()"
 *   (optionSelected)="onSelect($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-code-trace-card>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-code-trace-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, CodeHighlightComponent],
  templateUrl: './code-trace-card.component.html',
  styleUrl: './code-trace-card.component.scss',
})
export class CodeTraceCardComponent {
  /** The code-trace card to display. */
  readonly card = input.required<CodeTraceCard>();

  /** Index of the currently selected output option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Nonce for deterministic option shuffling. */
  readonly shuffleNonce = input<number>(0);

  /** Emits when the user selects an output option. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  /** The headline: question, caption, or card title. */
  readonly questionHeadline = computed(() => {
    const card = this.card();
    return card.question?.trim() || card.caption?.trim() || card.title;
  });

  /**
   * Resolved card data with shuffled options.
   * @remarks
   * Uses `resolveOptionCard` to apply direction and shuffle nonce.
   */
  readonly resolved = computed(() => {
    const card = this.card();
    return resolveOptionCard(card, 'known-to-learning', this.shuffleNonce());
  });

  optionClass(index: number): string {
    return buildOptionClass(
      index,
      this.selectedIndex(),
      this.feedback(),
      this.resolved().correctIndex,
    );
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
