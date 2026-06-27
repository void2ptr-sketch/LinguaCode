import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import type { PhoneticLexeme } from '../../../../core/models/phonetic-content.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { resolveQuizQuestionHeaderDisplay } from '../quiz-card-question.utils';

@Component({
  selector: 'app-quiz-card-question-header',
  imports: [MatCardModule, LexemeDisplayComponent],
  templateUrl: './quiz-card-question-header.component.html',
})
export class QuizCardQuestionHeaderComponent {
  readonly title = input.required<string>();
  readonly prompt = input.required<string>();
  readonly promptLexeme = input<PhoneticLexeme | undefined>();
  readonly plainText = input(false);

  readonly mode = computed(() => resolveQuizQuestionHeaderDisplay(this.title(), this.prompt()));
}
