import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/cards/card-direction.utils';
import { SymbolCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * UI component for symbol (character recognition) cards.
 *
 * @remarks
 * Displays a Chinese character with symbol options for recognition practice.
 * Supports feedback display (correct/incorrect) and navigation to the next card.
 *
 * @example
 * ```html
 * <app-symbol-card
 *   [card]="symbolCard"
 *   [direction]="'known-to-learning'"
 *   (optionSelected)="onSelect($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-symbol-card>
 * ```
 */
@Component({
  selector: 'app-symbol-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './symbol-card.component.html',
  styleUrl: './symbol-card.component.scss',
})
export class SymbolCardComponent {
  /** The symbol card to display (character recognition exercise). */
  readonly card = input.required<SymbolCard>();

  /** Card direction: 'known-to-learning' or 'learning-to-known'. Defaults to 'known-to-learning'. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Index of the currently selected symbol option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. Defaults to 'md'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when the user selects a symbol option. Payload is the zero-based index. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  /**
   * Resolved card data with direction applied.
   * @remarks
   * Uses `effectiveCardDirection` to determine the effective direction,
   * then resolves the option card data.
   */
  readonly resolved = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveOptionCard(card, direction);
  });

  /**
   * Returns the prompt lexeme for the current card.
   * @remarks
   * Prefers the resolved prompt lexeme, falls back to the card's prompt lexeme.
   */
  /**
   * Returns the prompt lexeme for the resolved direction, falling back to the card's default.
   */
  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  /**
   * Returns the lexeme for a given option index.
   *
   * @param index - Zero-based option index.
   * @returns The option lexeme, or undefined if not available.
   */
  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index];
  }

  /**
   * Returns the CSS class for an option based on selection and feedback state.
   *
   * @param index - Zero-based option index.
   * @returns CSS class string for styling the option card.
   */
  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

  /**
   * Handles option selection.
   *
   * @param index - Zero-based index of the selected option.
   * @remarks
   * No-op if feedback is already displayed (correct/incorrect).
   */
  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
