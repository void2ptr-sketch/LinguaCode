import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SelectCard } from '../../../../core/models';
import { CardSelectFeedback } from '../../types';

@Component({
  selector: 'app-card-select-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './card-select-card.component.html',
  styleUrl: './card-select-card.component.scss',
})
export class CardSelectCardComponent {
  readonly card = input.required<SelectCard>();
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardSelectFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }

  onCheckAnswer(): void {
    this.checkAnswer.emit();
  }

  onNextCard(): void {
    this.nextCard.emit();
  }

  optionClass(index: number): string {
    const classes = ['option'];
    const selected = this.selectedIndex();
    const feedback = this.feedback();
    const card = this.card();

    if (selected === index) {
      classes.push('option--selected');
    }

    if (feedback !== null) {
      if (index === card.correctIndex) {
        classes.push('option--correct');
      } else if (selected === index) {
        classes.push('option--incorrect');
      }
    }

    return classes.join(' ');
  }
}
