import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  applyToneToPinyinSyllable,
  toneMarkLabel,
} from '../../../../core/data/chinese/tone-mark.utils';
import { ToneCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { ToneMark } from '../../../../core/models/phonetic-content.types';
import { ToneColoredTextComponent } from '../../chinese/tone-colored-text/tone-colored-text.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

/**
 * Tone card component. Displays a tone mark selection exercise where the user
 * chooses the correct tone for a given pinyin syllable base.
 * @remarks Supports tone coloring via `ToneColoredTextComponent`.
 */
@Component({
  selector: 'app-tone-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ToneColoredTextComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './tone-card.component.html',
  styleUrl: './tone-card.component.scss',
})
export class ToneCardComponent {
  /** The tone card to display (tone mark selection exercise). */
  readonly card = input.required<ToneCard>();

  /** Card direction: 'known-to-learning' or 'learning-to-known'. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Index of the currently selected tone option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when the user selects a tone option. Payload is the zero-based index. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  /**
   * Returns the display label for a tone mark.
   *
   * @param tone - The tone mark to label.
   * @returns The human-readable tone label.
   */
  toneLabel(tone: ToneMark): string {
    return toneMarkLabel(tone);
  }

  /**
   * Applies a tone mark to the syllable base.
   *
   * @param tone - The tone mark to apply.
   * @returns The syllable with the tone mark applied.
   */
  tonedSyllable(tone: ToneMark): string {
    return applyToneToPinyinSyllable(this.card().syllableBase, tone);
  }

  /**
   * Returns the CSS class for an option based on selection and feedback state.
   *
   * @param index - Zero-based option index.
   * @returns CSS class string for styling the option card.
   */
  optionClass(index: number): string {
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), this.card().correctIndex);
  }

  /**
   * Emits the selected tone option index.
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
