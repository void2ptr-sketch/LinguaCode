import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CodeSelectCard } from '../../../../core/models';
import { CodeHighlightComponent } from '../../code-highlight/code-highlight.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-code-select-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, CodeHighlightComponent],
  templateUrl: './code-select-card.component.html',
  styleUrl: './code-select-card.component.scss',
})
export class CodeSelectCardComponent {
  readonly card = input.required<CodeSelectCard>();
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  /** Текст вопроса для ученика: caption или title (без дубля в блоке кода). */
  readonly questionHeadline = computed(() => {
    const caption = this.card().caption?.trim();
    return caption || this.card().title;
  });

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
