import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import type { PhoneticLexeme } from '../../../../core/models';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { resolveQuizQuestionHeaderDisplay } from '../quiz-card-question.util';

/**
 * Quiz card question header component. Displays the question title and prompt
 * with optional lexeme display for CJK content.
 * @remarks Supports both rich (lexeme) and plain text display modes.
 */
@Component({
  selector: 'app-quiz-card-question-header',
  imports: [MatCardModule, LexemeDisplayComponent],
  templateUrl: './quiz-card-question-header.component.html',
})
export class QuizCardQuestionHeaderComponent {
  /**
   * Required question title displayed in the header.
   * @remarks
   * Always rendered regardless of display mode.
   */
  readonly title = input.required<string>();

  /**
   * Required question prompt text.
   * @remarks
   * Displayed below the title. Used with `promptLexeme` for CJK phonetic rendering.
   */
  readonly prompt = input.required<string>();

  /**
   * Optional lexeme data for CJK phonetic display.
   * @remarks
   * When provided and `plainText` is false, renders the prompt with tone coloring and romanizations.
   */
  readonly promptLexeme = input<PhoneticLexeme | undefined>();

  /**
   * Whether to render in plain text mode.
   * @remarks
   * When true, skips lexeme display and renders the prompt as plain text.
   */
  readonly plainText = input(false);

  /**
   * Computed display mode based on title and prompt content.
   * @remarks
   * Determines whether to show title-only, prompt-only, or both.
   */
  readonly mode = computed(() => resolveQuizQuestionHeaderDisplay(this.title(), this.prompt()));
}
