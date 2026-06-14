import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  applyToneToPinyinSyllable,
  toneMarkLabel,
} from '../../../../core/data/tone-mark.utils';
import { ToneCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { ToneMark } from '../../../../core/models/phonetic-content.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-tone-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, LexemeDisplayComponent],
  templateUrl: './tone-card.component.html',
  styleUrl: './tone-card.component.scss',
})
export class ToneCardComponent {
  readonly card = input.required<ToneCard>();
  readonly direction = input<CardDirection>('known-to-learning');
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  toneLabel(tone: ToneMark): string {
    return toneMarkLabel(tone);
  }

  tonedSyllable(tone: ToneMark): string {
    return applyToneToPinyinSyllable(this.card().syllableBase, tone);
  }

  optionClass(index: number): string {
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), this.card().correctIndex);
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
