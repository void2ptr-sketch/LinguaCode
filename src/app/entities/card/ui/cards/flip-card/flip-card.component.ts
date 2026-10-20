import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlipCard } from '../../../model';
import type { CardDirection } from '../../../../language-pair/model/language-pair.types';
import { CardFeedback } from '../../../model/card-interaction.types';
import { playLearningAudio } from '../../../utils/card-learning-audio.utils';
import { LexemeDisplayComponent } from '../../../../chinese/ui/lexeme-display/lexeme-display.component';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * Flip card: a classic two-sided flashcard.
 *
 * @remarks
 * The user sees the front side, reveals the back side, then self-reports the
 * result with «Знаю» / «Не знаю» buttons. There is no objective answer check;
 * `flipKnown` is recorded into the session result (basis for spaced repetition).
 *
 * @example
 * ```html
 * <app-flip-card
 *   [card]="flipCard"
 *   [direction]="'known-to-learning'"
 *   [flipKnown]="flipKnown()"
 *   [feedback]="feedback()"
 *   (flipKnownChange)="onFlipKnown($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-flip-card>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-flip-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './flip-card.component.html',
  styleUrl: './flip-card.component.scss',
})
export class FlipCardComponent {
  /** The flip card to display (front/back sides). */
  readonly card = input.required<FlipCard>();

  /** Card direction. Flips which side is shown as the question. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Self-reported result: `true` — knew, `false` — did not know, `null` — not reported. */
  readonly flipKnown = input<boolean | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits the self-reported result when the user clicks «Знаю» / «Не знаю». */
  readonly flipKnownChange = output<boolean>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  /** Whether the back side is revealed. */
  readonly revealed = signal(false);

  /** Text shown as the question (front or back depending on direction). */
  readonly front = computed(() => {
    const card = this.card();
    return this.direction() === 'learning-to-known' ? card.back : card.front;
  });

  /** Text shown as the answer side. */
  readonly back = computed(() => {
    const card = this.card();
    return this.direction() === 'learning-to-known' ? card.front : card.back;
  });

  /** Lexeme of the question side. */
  readonly frontLexeme = computed(() => {
    const card = this.card();
    return this.direction() === 'learning-to-known' ? card.backLexeme : card.frontLexeme;
  });

  /** Lexeme of the answer side. */
  readonly backLexeme = computed(() => {
    const card = this.card();
    return this.direction() === 'learning-to-known' ? card.frontLexeme : card.backLexeme;
  });

  constructor() {
    effect(() => {
      // Reset the reveal state when a new card is mounted.
      void this.card().id;
      this.revealed.set(false);
    });
  }

  /** Reveals the back side. */
  reveal(): void {
    if (this.feedback() !== null) {
      return;
    }

    this.revealed.set(true);
  }

  /** Records a self-assessment and reveals the back side. */
  selectKnown(knows: boolean): void {
    if (this.feedback() !== null) {
      return;
    }

    this.revealed.set(true);
    this.flipKnownChange.emit(knows);
  }

  /** Plays the audio for the back side (audioUrl or speech synthesis). */
  playAudio(): void {
    const audioUrl = this.card().audioUrl;
    if (!audioUrl) {
      return;
    }

    void playLearningAudio({ audioUrl, text: '', language: 'en' });
  }
}
