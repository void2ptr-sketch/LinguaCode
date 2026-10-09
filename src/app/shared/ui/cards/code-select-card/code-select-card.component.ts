import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CodeSelectCard } from '../../../../core/models';
import { CodeHighlightComponent } from '../../code-highlight/code-highlight.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';

@Component({
  selector: 'app-code-select-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, CodeHighlightComponent],
  templateUrl: './code-select-card.component.html',
  styleUrl: './code-select-card.component.scss',
})
export class CodeSelectCardComponent {
  /** The code-select card to display (code block selection exercise). */
  readonly card = input.required<CodeSelectCard>();

  /** Index of the currently selected code block option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when the user selects a code block option. Payload is the zero-based index. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
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
