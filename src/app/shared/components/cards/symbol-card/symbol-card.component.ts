import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/card-direction.utils';
import { SymbolCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

@Component({
  selector: 'app-symbol-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, LexemeDisplayComponent, QuizCardQuestionHeaderComponent],
  templateUrl: './symbol-card.component.html',
  styleUrl: './symbol-card.component.scss',
})
export class SymbolCardComponent {
  readonly card = input.required<SymbolCard>();
  readonly direction = input<CardDirection>('known-to-learning');
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly resolved = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveOptionCard(card, direction);
  });

  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index];
  }

  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
