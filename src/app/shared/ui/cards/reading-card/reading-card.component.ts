import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/repositories/cards/card-direction.utils';
import { ReadingCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * Reading card component. Displays a reading passage exercise with multiple-choice options.
 * @remarks Supports directional display (known→learning / learning→known) and lexeme display.
 */
@Component({
  selector: 'app-reading-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './reading-card.component.html',
  styleUrl: './reading-card.component.scss',
})
export class ReadingCardComponent {
  /**
   * The reading card to display (passage interpretation exercise).
   * @remarks
   * Contains a reading passage with multiple-choice options for comprehension.
   */
  readonly card = input.required<ReadingCard>();

  /**
   * Card direction: 'known-to-learning' or 'learning-to-known'.
   * @remarks
   * Overrides the card's default direction for display resolution.
   */
  readonly direction = input<CardDirection>('known-to-learning');

  /**
   * Index of the currently selected option (null if none).
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
   * @remarks Defaults to 'md'. Affects text and option sizing.
   */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Emits when the user selects an option.
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
   * Computed resolved card data with direction applied.
   * @remarks
   * Uses `effectiveCardDirection` and `resolveOptionCard` to determine the effective prompt and options.
   */
  readonly resolved = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveOptionCard(card, direction);
  });

  /**
   * Returns the prompt lexeme for the resolved direction, falling back to the card's default.
   *
   * @remarks
   * Prefers the resolved prompt lexeme from `resolved().promptLexeme`,
   * falls back to `card.promptLexeme` if not available.
   */
  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  /**
   * Returns the lexeme for an option at the given index.
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
