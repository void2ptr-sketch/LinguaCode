import { Component, input, output } from '@angular/core';
import { Card } from '../../../core/models';
import type { CardDirection } from '../../../core/models/language-pair.types';
import type { DrawAnswerPayload } from '../../types/draw-answer.types';
import { CardFeedback } from '../../types';
import { CardFocusShellComponent } from '../card-focus-shell/card-focus-shell.component';
import { CodeSelectCardComponent } from '../cards/code-select-card/code-select-card.component';
import { DrawCardComponent } from '../../../features/hanzi-practice/components/draw-card/draw-card.component';
import { KeyboardCardComponent } from '../cards/keyboard-card/keyboard-card.component';
import { MemoryCardComponent } from '../cards/memory-card/memory-card.component';
import { ReadingCardComponent } from '../cards/reading-card/reading-card.component';
import { SelectCardComponent } from '../cards/select-card/select-card.component';
import { SoundCardComponent } from '../cards/sound-card/sound-card.component';
import { SymbolCardComponent } from '../cards/symbol-card/symbol-card.component';
import { TimedCardComponent } from '../cards/timed-card/timed-card.component';
import { ToneCardComponent } from '../cards/tone-card/tone-card.component';

/**
 * Host component that dispatches to card-specific UI components.
 *
 * @remarks
 * Renders one of 11 card kinds based on `card.kind`. Delegates interaction
 * events through output signals. Wraps each card in a focus shell for keyboard
 * navigation.
 *
 * @example
 * ```html
 * <app-card-host
 *   [card]="myCard"
 *   [fontSize]="'lg'"
 *   [direction]="'known-to-learning'"
 *   (optionSelected)="onSelect($event)"
 *   (checkAnswer)="onCheck()"
 *   (nextCard)="onNext()">
 * </app-card-host>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-card-host',
  imports: [
    CardFocusShellComponent,
    SelectCardComponent,
    MemoryCardComponent,
    SymbolCardComponent,
    SoundCardComponent,
    TimedCardComponent,
    KeyboardCardComponent,
    CodeSelectCardComponent,
    DrawCardComponent,
    ToneCardComponent,
    ReadingCardComponent,
  ],
  templateUrl: './card-host.component.html',
})
export class CardHostComponent {
  /** The card to render. Determines which card kind component is displayed. */
  readonly card = input.required<Card>();

  /** Font size: 'sm', 'md' (default), or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Card direction: 'known-to-learning' (default) or 'learning-to-known'. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Current feedback state for the card (e.g., 'correct', 'incorrect'). */
  readonly feedback = input<CardFeedback>(null);

  /** Zero-based index of the selected option, if applicable. */
  readonly selectedIndex = input<number | null>(null);

  /** Current text entered by the user (for keyboard/input cards). */
  readonly answerText = input('');

  /** Whether the memory card exercise is complete. */
  readonly memoryComplete = input(false);

  /** Nonce value to randomize the memory card board layout. */
  readonly memoryBoardNonce = input(0);

  /** Whether the draw card submission has been triggered. */
  readonly drawSubmitted = input(false);

  /** Payload from the draw card submission (strokes, timing). */
  readonly drawAnswer = input<DrawAnswerPayload | null>(null);

  /** Whether keyboard focus controls are enabled. */
  readonly focusControlsEnabled = input(true);

  /** Whether to auto-focus the card in fullscreen mode on mount. */
  readonly autoFocusFullscreen = input(false);

  /** Emits when the user selects an option (by index). */
  readonly optionSelected = output<number>();

  /** Emits when the user changes the answer text. */
  readonly answerTextChange = output<string>();

  /** Emits when the memory card exercise is completed. */
  readonly memoryCompleteChange = output<boolean>();

  /** Emits when the draw card is submitted. */
  readonly drawSubmittedChange = output<boolean>();

  /** Emits the draw answer payload when submission is complete. */
  readonly drawAnswerChange = output<DrawAnswerPayload | null>();

  /** Emits when the timed card countdown expires. */
  readonly timeExpired = output<void>();

  /** Emits when the user requests answer verification. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
  readonly nextCard = output<void>();
}
