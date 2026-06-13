import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { KeyboardCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { getCorrectAnswerLabel } from '../../../utils/card-answer.utils';

@Component({
  selector: 'app-keyboard-card',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LexemeDisplayComponent,
  ],
  templateUrl: './keyboard-card.component.html',
  styleUrl: './keyboard-card.component.scss',
})
export class KeyboardCardComponent {
  readonly card = input.required<KeyboardCard>();
  readonly direction = input<CardDirection>('known-to-learning');
  readonly answerText = input('');
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly answerTextChange = output<string>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  correctLabel(): string | null {
    return getCorrectAnswerLabel(this.card(), this.direction());
  }
}
