import { Component, computed, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/repositories/cards/card-direction.utils';
import { TimedCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * Timed card component. Displays a multiple-choice exercise with a countdown timer.
 * Emits `timeExpired` when the user fails to answer within the time limit.
 * @remarks Timer starts on `ngOnInit` and is cleared on `ngOnDestroy`.
 */
@Component({
  selector: 'app-timed-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './timed-card.component.html',
  styleUrl: './timed-card.component.scss',
})
export class TimedCardComponent implements OnInit, OnDestroy {
  /**
   * The timed card to display (answer within time limit).
   * @remarks
   * Contains a multiple-choice question with a countdown timer. Emits `timeExpired`
   * when the user fails to answer within the time limit.
   */
  readonly card = input.required<TimedCard>();

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
   * Emits when the time limit expires without an answer.
   * @remarks
   * Triggered when `secondsLeft` reaches 0 and no feedback is displayed.
   */
  readonly timeExpired = output<void>();

  /**
   * Remaining seconds in the countdown timer.
   * @remarks
   * Initialized from `card.timeLimitSec` on component initialization.
   * Decrements every second until zero.
   */
  readonly secondsLeft = signal(0);
  private timerId: number | null = null;

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

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
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
   * No-op if feedback is already displayed or time has expired.
   */
  selectOption(index: number): void {
    if (this.feedback() !== null || this.secondsLeft() <= 0) {
      return;
    }

    this.optionSelected.emit(index);
  }

  private startTimer(): void {
    this.clearTimer();
    this.secondsLeft.set(this.card().timeLimitSec);
    this.timerId = window.setInterval(() => {
      const next = this.secondsLeft() - 1;
      this.secondsLeft.set(next);

      if (next <= 0) {
        this.clearTimer();
        if (this.feedback() === null) {
          this.timeExpired.emit();
        }
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
