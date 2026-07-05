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
import { CodeHighlightComponent } from '../../../../../../shared/components/code-highlight/code-highlight.component';

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
  readonly draft = input.required<CodeSelectCardDraft>();

  readonly draftChange = output<CodeSelectCardDraft>();

  readonly languages = CODE_HIGHLIGHT_LANGUAGES;
  readonly languageLabels = CODE_HIGHLIGHT_LANGUAGE_LABELS;

  updateDraft(next: CodeSelectCardDraft): void {
    this.draftChange.emit(next);
  }

  updateCaption(value: string): void {
    this.updateDraft({ ...this.draft(), caption: value });
  }

  updatePromptCode(value: string): void {
    this.updateDraft({
      ...this.draft(),
      prompt: { ...this.draft().prompt, code: value },
    });
  }

  updatePromptLanguage(language: CodeHighlightLanguage): void {
    this.updateDraft({
      ...this.draft(),
      prompt: { ...this.draft().prompt, language },
    });
  }

  updateOptionCode(index: number, code: string): void {
    const options = this.draft().options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, code } : option,
    );
    this.updateDraft({ ...this.draft(), options });
  }

  updateOptionLanguage(index: number, language: CodeHighlightLanguage): void {
    const options = this.draft().options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, language } : option,
    );
    this.updateDraft({ ...this.draft(), options });
  }

  updateCorrectIndex(index: number): void {
    this.updateDraft({ ...this.draft(), correctIndex: index });
  }

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
