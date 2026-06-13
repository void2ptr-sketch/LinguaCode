import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DrawCard } from '../../../../core/models';
import { CardFeedback } from '../../../types';

@Component({
  selector: 'app-draw-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './draw-card.component.html',
  styleUrl: './draw-card.component.scss',
})
export class DrawCardComponent {
  readonly card = input.required<DrawCard>();
  readonly drawSubmitted = input(false);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly drawSubmittedChange = output<boolean>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  submitDrawing(): void {
    if (this.feedback() !== null) {
      return;
    }

    this.drawSubmittedChange.emit(true);
  }
}
