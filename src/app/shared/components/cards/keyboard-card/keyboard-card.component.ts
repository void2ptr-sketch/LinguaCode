import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  effectiveCardDirection,
  resolveKeyboardPrompt,
} from '../../../../core/data/card-direction.utils';
import { resolveKeyboardAnswerMode } from '../../../../core/data/keyboard-answer-mode.utils';
import { KeyboardCard } from '../../../../core/models';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { PinyinKeyboardComponent } from '../../pinyin-keyboard/pinyin-keyboard.component';
import { CardFeedback } from '../../../types';
import { getCorrectAnswerLabel } from '../../../utils/card-answer.utils';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';

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
    PinyinKeyboardComponent,
    QuizCardQuestionHeaderComponent,
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

  readonly answerMode = computed(() => resolveKeyboardAnswerMode(this.card()));
  readonly usesIpaInput = computed(() => this.answerMode() === 'ipa');
  readonly usesPinyinKeyboard = computed(() => this.answerMode() === 'pinyin');

  readonly resolvedPrompt = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    return resolveKeyboardPrompt(card, direction);
  });

  readonly promptLexeme = computed(() => {
    const card = this.card();
    const direction = effectiveCardDirection(card.direction, this.direction());
    if (direction === 'learning-to-known') {
      return card.promptLexeme;
    }

    return card.promptLexeme?.glossKnown
      ? { ...card.promptLexeme, primary: this.resolvedPrompt() }
      : card.promptLexeme;
  });

  correctLabel(): string | null {
    return getCorrectAnswerLabel(this.card(), this.direction());
  }
}
