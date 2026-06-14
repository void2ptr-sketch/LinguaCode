import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import type { LexemeDraftFields } from '../../../../../../core/data/lexeme-draft.utils';
import type { CardOptionsEditorState } from '../../../../utils/card-options-editor.utils';
import type {
  ReadingCardDraft,
  SelectCardDraft,
  SymbolCardDraft,
  TimedCardDraft,
  ToneCardDraft,
} from '../../../../types';
import { toneVariantPreview } from '../../../../utils/tone-variant.utils';
import { CardOptionsEditorComponent } from '../../../card-options-editor/card-options-editor.component';

export type ChoiceCardDraft =
  | SelectCardDraft
  | ReadingCardDraft
  | TimedCardDraft
  | SymbolCardDraft
  | ToneCardDraft;

@Component({
  selector: 'app-choice-card-form',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    CardOptionsEditorComponent,
  ],
  templateUrl: './choice-card-form.component.html',
})
export class ChoiceCardFormComponent {
  readonly draft = input.required<ChoiceCardDraft>();
  readonly hidePrompt = input(false);

  readonly draftChange = output<ChoiceCardDraft>();

  readonly toneDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'tone' ? draft : null;
  });

  updateDraft(next: ChoiceCardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptKnown(value: string): void {
    this.updateDraft({ ...this.draft(), promptKnown: value });
  }

  updateCorrectIndex(index: number): void {
    this.updateDraft({ ...this.draft(), correctIndex: index });
  }

  updateSyllableBase(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'tone') {
      return;
    }

    this.updateDraft({ ...draft, syllableBase: value });
  }

  onOptionsStateChange(state: CardOptionsEditorState): void {
    const draft = this.draft();

    switch (draft.kind) {
      case 'select':
      case 'reading':
      case 'timed':
        this.updateDraft({
          ...draft,
          optionsLearning: state.options,
          optionsLexemes: state.lexemes,
          correctIndex: state.correctIndex,
        });
        break;
      case 'symbol':
        this.updateDraft({
          ...draft,
          symbols: state.options,
          symbolLexemes: state.lexemes,
          correctIndex: state.correctIndex,
        });
        break;
    }
  }

  optionTexts(): readonly string[] {
    const draft = this.draft();
    if (draft.kind === 'symbol') {
      return draft.symbols;
    }

    if (draft.kind === 'tone') {
      return [];
    }

    return draft.optionsLearning;
  }

  optionLexemes(): readonly LexemeDraftFields[] {
    const draft = this.draft();
    if (draft.kind === 'symbol') {
      return draft.symbolLexemes;
    }

    if (draft.kind === 'tone') {
      return [];
    }

    return draft.optionsLexemes;
  }

  promptLabel(): string {
    switch (this.draft().kind) {
      case 'reading':
        return 'Контекст (известный)';
      case 'tone':
        return 'Подсказка';
      default:
        return 'Известный';
    }
  }

  optionsConfig() {
    const draft = this.draft();

    switch (draft.kind) {
      case 'reading':
        return { title: 'Варианты чтения', optionLabelPrefix: 'Чтение', showCorrectRadio: true };
      case 'symbol':
        return { title: 'Символы', optionLabelPrefix: 'Символ', showCorrectRadio: true };
      case 'select':
      case 'timed':
        return { title: 'Варианты (новый)', optionLabelPrefix: 'Новый', showCorrectRadio: true };
      default:
        return { title: 'Варианты', optionLabelPrefix: 'Вариант', showCorrectRadio: true };
    }
  }

  tonePreview(): string {
    const draft = this.draft();
    if (draft.kind !== 'tone') {
      return '';
    }

    return toneVariantPreview(draft.syllableBase, draft.toneOptions);
  }
}
