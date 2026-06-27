import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  playLearningAudio,
  resolveLearningSpeech,
} from '../../../../core/data/card-learning-audio.utils';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/card-direction.utils';
import { SoundCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { PhoneticLexeme } from '../../../../core/models/phonetic-content.types';
import { UserStore } from '../../../../core/state';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

@Component({
  selector: 'app-sound-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, LexemeDisplayComponent, QuizCardQuestionHeaderComponent],
  templateUrl: './sound-card.component.html',
  styleUrl: './sound-card.component.scss',
})
export class SoundCardComponent {
  private readonly userStore = inject(UserStore);

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

  readonly stimulusLexeme = computed((): PhoneticLexeme => {
    const card = this.card();
    const label = card.audioLabelLearning.trim();

    if (card.promptLexeme?.primary.trim()) {
      return card.promptLexeme;
    }

    return { primary: label, script: 'latn' };
  });

  readonly hasAudioFile = computed(() => Boolean(this.card().audioUrl?.trim()));

  optionLexeme(index: number) {
    return this.resolved().optionLexemes?.[index];
  }

  optionClass(index: number): string {
    const resolved = this.resolved();
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), resolved.correctIndex);
  }

  playAudio(): void {
    const learningLanguage = this.userStore.languagePair().learning;
    const speech = resolveLearningSpeech(
      this.stimulusLexeme(),
      this.card().audioLabelLearning,
      learningLanguage,
    );

    playLearningAudio({
      audioUrl: this.card().audioUrl,
      text: speech.text,
      language: learningLanguage,
      speechLocale: speech.locale,
    });
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }

    this.optionSelected.emit(index);
  }
}
