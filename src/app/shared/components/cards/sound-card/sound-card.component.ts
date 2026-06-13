import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SoundCard } from '../../../../core/models';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-sound-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './sound-card.component.html',
  styleUrl: './sound-card.component.scss',
})
export class SoundCardComponent {
  readonly card = input.required<SoundCard>();
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

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
