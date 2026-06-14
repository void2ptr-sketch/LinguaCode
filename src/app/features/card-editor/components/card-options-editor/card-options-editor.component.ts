import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ContentLanguage } from '../../../../core/models';
import type { LexemeDraftFields } from '../../../../core/data/lexeme-draft.utils';
import { emptyLexemeDraftFields } from '../../../../core/data/lexeme-draft.utils';
import {
  addOption,
  MAX_CARD_OPTIONS,
  MIN_CARD_OPTIONS,
  optionTextReadonly,
  removeOption,
  type CardOptionsEditorState,
  updateOptionLexeme,
  updateOptionText,
} from '../../utils/card-options-editor.utils';
import { LexemeFieldsComponent } from '../lexeme-fields/lexeme-fields.component';

export type CardOptionsEditorConfig = {
  title: string;
  optionLabelPrefix: string;
  showCorrectRadio: boolean;
};

@Component({
  selector: 'app-card-options-editor',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatTooltipModule,
    LexemeFieldsComponent,
  ],
  templateUrl: './card-options-editor.component.html',
  styleUrl: './card-options-editor.component.scss',
})
export class CardOptionsEditorComponent {
  readonly config = input.required<CardOptionsEditorConfig>();
  readonly options = input.required<readonly string[]>();
  readonly lexemes = input.required<readonly LexemeDraftFields[]>();
  readonly correctIndex = input(0);
  readonly showLexemes = input(false);
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');

  readonly stateChange = output<CardOptionsEditorState>();

  readonly minOptions = MIN_CARD_OPTIONS;
  readonly maxOptions = MAX_CARD_OPTIONS;

  readonly editorState = computed(
    (): CardOptionsEditorState => ({
      options: this.options(),
      lexemes: this.lexemes(),
      correctIndex: this.correctIndex(),
    }),
  );

  isOptionReadonly(lexeme: LexemeDraftFields | undefined): boolean {
    return optionTextReadonly(this.showLexemes(), lexeme ?? emptyLexemeDraftFields());
  }

  emitState(next: CardOptionsEditorState): void {
    this.stateChange.emit(next);
  }

  onOptionTextChange(index: number, value: string): void {
    this.emitState(
      updateOptionText(
        this.editorState(),
        index,
        value,
        this.knownLanguage(),
        this.learningLanguage(),
        this.showLexemes(),
      ),
    );
  }

  onOptionLexemeChange(index: number, fields: LexemeDraftFields): void {
    this.emitState(updateOptionLexeme(this.editorState(), index, fields));
  }

  onCorrectIndexChange(index: number): void {
    this.emitState({ ...this.editorState(), correctIndex: index });
  }

  onAddOption(): void {
    const next = addOption(this.editorState());
    if (next) {
      this.emitState(next);
    }
  }

  onRemoveOption(index: number, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    const next = removeOption(this.editorState(), index);
    if (next) {
      this.emitState(next);
    }
  }

  optionTrack(index: number): string {
    return `${this.options().length}-${index}`;
  }

  removeTooltip(): string {
    return this.options().length <= this.minOptions
      ? 'Нужно минимум 2 варианта'
      : 'Удалить вариант';
  }
}
