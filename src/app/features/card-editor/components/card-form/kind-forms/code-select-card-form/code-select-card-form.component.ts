import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import {
  CODE_HIGHLIGHT_LANGUAGE_LABELS,
  CODE_HIGHLIGHT_LANGUAGES,
} from '../../../../../../core/data/code-highlight/code-highlight.utils';
import type { CodeHighlightLanguage } from '../../../../../../core/models';
import type { CodeBlockDraft, CodeSelectCardDraft } from '../../../../types';
import { CodeHighlightComponent } from '../../../../../../shared/ui/code-highlight';

/**
 * Form component for code-select cards. Manages code prompt, code options, and correct answer selection.
 * @remarks Supports syntax highlighting preview and up to 8 code options.
 */
@Component({
  selector: 'app-code-select-card-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    CodeHighlightComponent,
  ],
  templateUrl: './code-select-card-form.component.html',
  styleUrl: './code-select-card-form.component.scss',
})
export class CodeSelectCardFormComponent {
  /** Required code-select card draft. */
  readonly draft = input.required<CodeSelectCardDraft>();

  /** Emits the updated code-select card draft when the user makes changes. */
  readonly draftChange = output<CodeSelectCardDraft>();

  /** Available code highlight languages. */
  readonly languages = CODE_HIGHLIGHT_LANGUAGES;
  /** Labels for code highlight languages. */
  readonly languageLabels = CODE_HIGHLIGHT_LANGUAGE_LABELS;

  /**
   * Emits the updated code-select card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: CodeSelectCardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the caption text.
   *
   * @param value - The new caption text.
   */
  updateCaption(value: string): void {
    this.updateDraft({ ...this.draft(), caption: value });
  }

  /**
   * Updates the prompt code block.
   *
   * @param value - The new code string.
   */
  updatePromptCode(value: string): void {
    this.updateDraft({
      ...this.draft(),
      prompt: { ...this.draft().prompt, code: value },
    });
  }

  /**
   * Updates the prompt code language.
   *
   * @param language - The new syntax highlighting language.
   */
  updatePromptLanguage(language: CodeHighlightLanguage): void {
    this.updateDraft({
      ...this.draft(),
      prompt: { ...this.draft().prompt, language },
    });
  }

  /**
   * Updates the code of an option at the given index.
   *
   * @param index - The zero-based index of the option.
   * @param code - The new code string.
   */
  updateOptionCode(index: number, code: string): void {
    const options = this.draft().options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, code } : option,
    );
    this.updateDraft({ ...this.draft(), options });
  }

  /**
   * Updates the language of an option at the given index.
   *
   * @param index - The zero-based index of the option.
   * @param language - The new syntax highlighting language.
   */
  updateOptionLanguage(index: number, language: CodeHighlightLanguage): void {
    const options = this.draft().options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, language } : option,
    );
    this.updateDraft({ ...this.draft(), options });
  }

  /**
   * Updates the index of the correct option.
   *
   * @param index - The zero-based index of the correct option.
   */
  updateCorrectIndex(index: number): void {
    this.updateDraft({ ...this.draft(), correctIndex: index });
  }

  /**
   * Adds a new code option.
   * @remarks
   * Respects the maximum of 8 options. Creates an empty `CodeBlockDraft` with the prompt language.
   */
  addOption(): void {
    const draft = this.draft();
    if (draft.options.length >= 8) {
      return;
    }

    this.updateDraft({
      ...draft,
      options: [...draft.options, emptyCodeBlockDraft(draft.prompt.language)],
    });
  }

  /**
   * Removes an option at the given index.
   *
   * @param index - The zero-based index of the option to remove.
   * @remarks
   * Respects the minimum of 2 options. Adjusts `correctIndex` if needed to stay in bounds.
   */
  removeOption(index: number): void {
    const draft = this.draft();
    if (draft.options.length <= 2) {
      return;
    }

    const options = draft.options.filter((_option, optionIndex) => optionIndex !== index);
    const correctIndex =
      draft.correctIndex >= options.length
        ? Math.max(0, options.length - 1)
        : draft.correctIndex > index
          ? draft.correctIndex - 1
          : draft.correctIndex;

    this.updateDraft({ ...draft, options, correctIndex });
  }
}

function emptyCodeBlockDraft(language: CodeHighlightLanguage): CodeBlockDraft {
  return { code: '', language };
}
