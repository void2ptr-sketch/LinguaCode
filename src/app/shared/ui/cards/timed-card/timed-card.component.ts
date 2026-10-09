import { Component, computed, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/cards/card-direction.utils';
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
  /** The timed card to display (answer within time limit). */
  readonly card = input.required<TimedCard>();

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

  /** Emits when the time limit expires without an answer. */
  readonly timeExpired = output<void>();

  /** Remaining seconds in the countdown timer. */
  readonly secondsLeft = signal(0);
  private timerId: number | null = null;

  readonly resolved = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveOptionCard(card, direction);
  });

  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index];
  }

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

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
