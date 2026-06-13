import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SelectCard } from '../../../../core/models';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-select-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './select-card.component.html',
  styleUrl: './select-card.component.scss',
})
export class SelectCardComponent {
  readonly card = input.required<SelectCard>();
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
