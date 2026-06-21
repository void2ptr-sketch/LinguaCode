import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/card-direction.utils';
import { SoundCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-sound-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, LexemeDisplayComponent],
  templateUrl: './sound-card.component.html',
  styleUrl: './sound-card.component.scss',
})
export class SoundCardComponent {
  readonly card = input.required<SoundCard>();
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

  readonly audioLexeme = computed(
    () => this.resolved().promptLexeme ?? this.card().promptLexeme,
  );

  promptLexeme() {
    return this.resolved().promptLexeme ?? this.card().promptLexeme;
  }

  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index] ?? this.card().optionsLexemes?.[index];
  }

  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

  playAudio(): void {
    const url = this.card().audioUrl?.trim();
    if (!url) {
      return;
    }

    const audio = new Audio(url);
    void audio.play();
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
