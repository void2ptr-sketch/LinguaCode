import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/cards/card-direction.utils';
import { SelectCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * Select card: user chooses the correct translation from multiple options.
 *
 * @remarks
 * Renders a SelectCard with directional support (known→learning / learning→known).
 * Displays the prompt with optional lexeme info and a list of selectable options.
 *
 * @example
 * ```html
 * <app-select-card
 *   [card]="mySelectCard"
 *   [direction]="'known-to-learning'"
 *   [selectedIndex]="0"
 *   [feedback]="'correct'"
 *   [fontSize]="'lg'"
 *   (optionSelected)="onSelect($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-select-card>
 * ```
 */
@Component({
  selector: 'app-select-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './select-card.component.html',
  styleUrl: './select-card.component.scss',
})
export class SelectCardComponent {
  /** The select card to display. */
  readonly card = input.required<SelectCard>();

  /** Card direction: 'known-to-learning' or 'learning-to-known'. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Index of the currently selected option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when the user selects an option. Payload is the zero-based index. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  readonly resolved = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveOptionCard(card, direction);
  });

  /**
   * Returns the prompt lexeme for the resolved direction, falling back to the card's default.
   */
  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  /**
   * Returns the lexeme for an option at the given index, if available.
   *
   * @param index - Zero-based option index.
   * @returns The option lexeme, or undefined if not available.
   */
  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index];
  }

  /** Returns the CSS class for an option based on selection and feedback state. */
  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

  /**
   * Emits the selected option index.
   *
   * @param index - The zero-based index of the selected option.
   */
  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
