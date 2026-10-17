import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { resolveOptionCard } from '../../../utils/card-direction.utils';
import { CodeSelectCard } from '../../../model';
import { CodeHighlightComponent } from '../../code-highlight/code-highlight.component';
import { CardFeedback } from '../../../model/card-interaction.types';
import { buildOptionClass } from '../../../lib/cards/option-card.util';

/**
 * UI component for code-select card exercises.
 *
 * @remarks
 * Displays a code block prompt and multiple code block options.
 * The user selects the option that matches the prompt. Uses `CodeHighlightComponent`
 * for syntax highlighting.
 *
 * @example
 * ```html
 * <app-code-select-card
 *   [card]="codeSelectCard"
 *   [selectedIndex]="null"
 *   [feedback]="null"
 *   (optionSelected)="onSelect($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-code-select-card>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-code-select-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, CodeHighlightComponent],
  templateUrl: './code-select-card.component.html',
  styleUrl: './code-select-card.component.scss',
})
export class CodeSelectCardComponent {
  /**
   * The code-select card to display (code block selection exercise).
   * @remarks
   * Contains a code block prompt and multiple code block options for the user to choose from.
   */
  readonly card = input.required<CodeSelectCard>();

  /**
   * Index of the currently selected code block option (null if none).
   * @remarks
   * Updated via `optionSelected` output when the user selects an option.
   */
  readonly selectedIndex = input<number | null>(null);

  /**
   * Feedback state: 'correct', 'incorrect', or null.
   * @remarks
   * When set, disables further option selection and shows visual feedback.
   */
  readonly feedback = input<CardFeedback>(null);

  /**
   * Font size for card content: 'sm', 'md', or 'lg'.
   * @remarks Defaults to 'md'. Affects text and code block sizing.
   */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Nonce for deterministic option shuffling. */
  readonly shuffleNonce = input<number>(0);

  /**
   * Emits when the user selects a code block option.
   * @remarks Payload is the zero-based index of the selected option.
   */
  readonly optionSelected = output<number>();

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
   * The question headline for the student: caption or title (without duplication in the code block).
   * @remarks
   * Prefers `card.caption` if available and non-empty, falls back to `card.title`.
   */
  readonly questionHeadline = computed(() => {
    const caption = this.card().caption?.trim();
    return caption || this.card().title;
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

  /**
   * Returns the CSS class for an option based on selection and feedback state.
   *
   * @param index - Zero-based option index.
   * @returns CSS class string for styling the option card.
   */
  optionClass(index: number): string {
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), this.resolved().correctIndex);
  }

  /**
   * Emits the selected option index.
   *
   * @param index - The zero-based index of the selected option.
   * @remarks No-op if feedback is already displayed.
   */
  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
