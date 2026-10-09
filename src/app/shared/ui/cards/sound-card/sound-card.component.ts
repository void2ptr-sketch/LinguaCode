import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  playLearningAudio,
  resolveLearningSpeech,
} from '../../../../core/data/cards/card-learning-audio.utils';
import {
  effectiveCardDirection,
  resolveOptionCard,
} from '../../../../core/data/cards/card-direction.utils';
import { SoundCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { PhoneticLexeme } from '../../../../core/models/phonetic-content.types';
import { UserStore } from '../../../../core/state';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.util';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

@Component({
  selector: 'app-sound-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LexemeDisplayComponent,
    QuizCardQuestionHeaderComponent,
  ],
  templateUrl: './sound-card.component.html',
  styleUrl: './sound-card.component.scss',
})
export class SoundCardComponent {
  private readonly userStore = inject(UserStore);

  /** The sound card to display (audio matching exercise). */
  readonly card = input.required<SoundCard>();

  /** Card direction: 'known-to-learning' or 'learning-to-known'. */
  readonly direction = input<CardDirection>('known-to-learning');

  /** Index of the currently selected option (null if none). */
  readonly selectedIndex = input<number | null>(null);

  /** Feedback state: 'correct', 'incorrect', or null. */
  readonly feedback = input<CardFeedback>(null);

  /** Font size for card content: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Emits when the user selects an option. Payload is the zero-based index. */
  readonly optionSelected = output<number>();

  /** Emits when the user requests answer checking. */
  readonly checkAnswer = output<void>();

  /** Emits when the user advances to the next card. */
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
