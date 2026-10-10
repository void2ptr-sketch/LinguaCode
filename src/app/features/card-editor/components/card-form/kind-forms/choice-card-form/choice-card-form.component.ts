import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import type { LexemeDraftFields } from '../../../../../../core/domain/chinese/phonetics/lexeme-draft.utils';
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

/**
 * Union type of all choice-card drafts.
 *
 * @remarks
 * Includes select, reading, timed, symbol, and tone card drafts.
 * Used as the input type for `ChoiceCardFormComponent`.
 */
export type ChoiceCardDraft =
  SelectCardDraft | ReadingCardDraft | TimedCardDraft | SymbolCardDraft | ToneCardDraft;

/**
 * Form component for choice-type cards (select, reading, timed, symbol, tone).
 * Manages the prompt, answer options, and correct index selection.
 * @remarks Delegates option management to `CardOptionsEditorComponent`.
 */
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
  styleUrl: './choice-card-form.component.scss',
})
export class ChoiceCardFormComponent {
  /** Required choice card draft (select, reading, timed, symbol, or tone). */
  readonly draft = input.required<ChoiceCardDraft>();
  /** Whether to hide the prompt field. */
  readonly hidePrompt = input(false);

  /** Emits the updated choice card draft when the user makes changes. */
  readonly draftChange = output<ChoiceCardDraft>();

  /** Computed tone card draft, or null if the current kind is not 'tone'. */
  readonly toneDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'tone' ? draft : null;
  });

  /**
   * Emits the updated choice card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: ChoiceCardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the known-language prompt.
   *
   * @param value - The new prompt text.
   */
  updatePromptKnown(value: string): void {
    this.updateDraft({ ...this.draft(), promptKnown: value });
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
   * Updates the syllable base for tone cards.
   *
   * @param value - The new syllable base string.
   * @remarks
   * No-op for non-tone cards.
   */
  updateSyllableBase(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'tone') {
      return;
    }

    this.updateDraft({ ...draft, syllableBase: value });
  }

  /**
   * Handles state changes from the options editor.
   *
   * @param state - The updated options editor state.
   * @remarks
   * Updates options, lexemes, and correct index based on card kind
   * (select, reading, timed, symbol).
   */
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

  /**
   * Returns the option texts based on card kind.
   *
   * @returns Option text array: `symbols` for symbol cards, `optionsLearning` for others, empty for tone.
   */
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

  /**
   * Returns the lexeme drafts based on card kind.
   *
   * @returns Lexeme array: `symbolLexemes` for symbol cards, `optionsLexemes` for others, empty for tone.
   */
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

  /**
   * Returns the prompt label based on card kind.
   *
   * @returns Label string: "Контекст (известный)" for reading, "Подсказка" for tone, "Вопрос" for others.
   */
  promptLabel(): string {
    switch (this.draft().kind) {
      case 'reading':
        return 'Контекст (известный)';
      case 'tone':
        return 'Подсказка';
      default:
        return 'Вопрос';
    }
  }

  /**
   * Returns the options editor configuration based on card kind.
   *
   * @returns Configuration object with title, option label prefix, and showCorrectRadio flag.
   * @remarks
   * Different kinds use different labels: "Варианты чтения" for reading,
   * "Символы" for symbol, "Варианты (новый)" for select/timed.
   */
  optionsConfig() {
    const draft = this.draft();

    switch (draft.kind) {
      case 'reading':
        return { title: 'Варианты чтения', optionLabelPrefix: 'Чтение', showCorrectRadio: true };
      case 'symbol':
        return { title: 'Символы', optionLabelPrefix: 'Символ', showCorrectRadio: true };
      case 'select':
      case 'timed':
        return { title: 'Варианты (новый)', optionLabelPrefix: 'Ответ', showCorrectRadio: true };
      default:
        return { title: 'Варианты', optionLabelPrefix: 'Вариант', showCorrectRadio: true };
    }
  }

  /**
   * Returns the tone preview string.
   *
   * @returns Preview string showing tone variants, or empty string for non-tone cards.
   * @remarks
   * Uses `toneVariantPreview()` utility to render all tone marks for the current syllable.
   */
  tonePreview(): string {
    const draft = this.draft();
    if (draft.kind !== 'tone') {
      return '';
    }

    return toneVariantPreview(draft.syllableBase, draft.toneOptions);
  }
}
