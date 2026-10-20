import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ClozeCard } from '../../../model';
import { CardFeedback } from '../../../model/card-interaction.types';
import { buildOptionClass } from '../../../lib/cards/option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';
import { hashSeed, shuffleArray } from '../../../utils/card-shuffle.util';

/** Segment of the cloze prompt: static text or the blank placeholder. */
export type ClozePromptSegment = { text: string; blank: boolean };

/**
 * Cloze card: user fills a blank in a sentence.
 *
 * @remarks
 * Bimodal component:
 * - select mode (`options` set): the user picks one of the options;
 * - input mode (no options): the user types the answer.
 * Emits unified interaction events consumed by `CardHostComponent`.
 *
 * @example
 * ```html
 * <app-cloze-card
 *   [card]="clozeCard"
 *   [selectedIndex]="selectedIndex()"
 *   [answerText]="answerText()"
 *   [feedback]="feedback()"
 *   (optionSelected)="onSelect($event)"
 *   (answerTextChange)="onText($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-cloze-card>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cloze-card',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './cloze-card.component.html',
  styleUrl: './cloze-card.component.scss',
})
export class ClozeCardComponent {
  /** The cloze card to display. */
  readonly card = input.required<ClozeCard>();

  /** Index of the selected option (select mode). */
  readonly selectedIndex = input<number | null>(null);

  /** Current text entered by the user (input mode). */
  readonly answerText = input('');

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Nonce for deterministic option shuffling. */
  readonly shuffleNonce = input<number>(0);

  /** Emits when the user selects an option (select mode). */
  readonly optionSelected = output<number>();

  /** Emits when the user changes the answer text (input mode). */
  readonly answerTextChange = output<string>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();

  /** Whether the card runs in select mode (options provided). */
  readonly hasOptions = computed(() => (this.card().options?.length ?? 0) > 0);

  /**
   * Resolved card data with shuffled options (select mode only).
   * @remarks
   * Shuffles `options` and adjusts `correctIndex` when shuffleNonce is provided.
   */
  readonly resolved = computed(() => {
    const card = this.card();
    const options = card.options ?? [];
    const nonce = this.shuffleNonce();
    if (nonce === undefined || options.length <= 1) {
      return { options, correctIndex: card.correctIndex ?? -1 };
    }
    const seed = `${card.id}-${nonce}`;
    const shuffled = shuffleArray(options, hashSeed(seed));
    const newCorrectIndex = shuffled.indexOf(options[card.correctIndex ?? -1]);
    return { options: shuffled, correctIndex: newCorrectIndex };
  });

  /** The masked prompt split into segments (text + blank placeholder). */
  readonly promptSegments = computed<readonly ClozePromptSegment[]>(() =>
    splitClozePrompt(this.card().promptKnown),
  );

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

  onTextChange(value: string): void {
    this.answerTextChange.emit(value);
  }
}

const BLANK_PATTERN = /_+/g;

/** Splits a cloze prompt into static segments and the blank placeholder. */
export function splitClozePrompt(prompt: string): readonly ClozePromptSegment[] {
  const segments: ClozePromptSegment[] = [];
  let cursor = 0;
  for (const match of prompt.matchAll(BLANK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ text: prompt.slice(cursor, index), blank: false });
    }

    segments.push({ text: match[0], blank: true });
    cursor = index + match[0].length;
  }

  if (cursor < prompt.length) {
    segments.push({ text: prompt.slice(cursor), blank: false });
  }

  return segments.length > 0 ? segments : [{ text: prompt, blank: false }];
}
