import { Component, input, output } from '@angular/core';
import { Card } from '../../../core/models';
import { CardFeedback } from '../../types';
import { DrawCardComponent } from '../cards/draw-card/draw-card.component';
import { KeyboardCardComponent } from '../cards/keyboard-card/keyboard-card.component';
import { MemoryCardComponent } from '../cards/memory-card/memory-card.component';
import { SelectCardComponent } from '../cards/select-card/select-card.component';
import { SoundCardComponent } from '../cards/sound-card/sound-card.component';
import { SymbolCardComponent } from '../cards/symbol-card/symbol-card.component';
import { TimedCardComponent } from '../cards/timed-card/timed-card.component';

@Component({
  selector: 'app-card-host',
  imports: [
    SelectCardComponent,
    MemoryCardComponent,
    SymbolCardComponent,
    SoundCardComponent,
    TimedCardComponent,
    KeyboardCardComponent,
    DrawCardComponent,
  ],
  templateUrl: './card-host.component.html',
})
export class CardHostComponent {
  readonly card = input.required<Card>();
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');
  readonly feedback = input<CardFeedback>(null);
  readonly selectedIndex = input<number | null>(null);
  readonly answerText = input('');
  readonly memoryComplete = input(false);
  readonly drawSubmitted = input(false);

  readonly optionSelected = output<number>();
  readonly answerTextChange = output<string>();
  readonly memoryCompleteChange = output<boolean>();
  readonly drawSubmittedChange = output<boolean>();
  readonly timeExpired = output<void>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();
}
