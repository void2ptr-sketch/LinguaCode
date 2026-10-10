import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { syncLexemePrimaryFromText } from '../../../../utils/card-editor-ux.utils';
import type { ContentLanguage } from '../../../../../../core/models';
import type { CardOptionsEditorState } from '../../../../utils/card-options-editor.utils';
import type { SoundCardDraft } from '../../../../types';
import { CardOptionsEditorComponent } from '../../../card-options-editor/card-options-editor.component';

/**
 * Form component for sound/media cards. Manages audio labels, known options, and lexeme sync.
 * @remarks In basic mode, automatically syncs `audioLabelLexeme` from the audio label text.
 */
@Component({
  selector: 'app-media-card-form',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, CardOptionsEditorComponent],
  templateUrl: './media-card-form.component.html',
})
export class MediaCardFormComponent {
  /**
   * Required sound card draft.
   * @remarks
   * Bound with two-way binding (`[(draft)]`) in parent templates.
   */
  readonly draft = input.required<SoundCardDraft>();

  /**
   * Known (source) language for lexeme sync.
   * @defaultValue 'ru'
   * @remarks
   * Used to auto-populate `audioLabelLexeme` in basic mode.
   */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /**
   * Learning (target) language for lexeme sync.
   * @defaultValue 'en'
   * @remarks
   * Used to auto-populate `audioLabelLexeme` in basic mode.
   */
  readonly learningLanguage = input<ContentLanguage>('en');

  /**
   * Whether the editor is in advanced mode (disables auto-lexeme sync).
   * @defaultValue false
   * @remarks
   * When false (basic mode), `audioLabelLexeme` is auto-synced from `audioLabelLearning`.
   */
  readonly isAdvanced = input(false);

  /**
   * Emits the updated sound card draft when the user makes changes.
   * @remarks
   * Used with two-way binding: `(draftChange)="onDraftChange($event)"`.
   */
  readonly draftChange = output<SoundCardDraft>();

  /**
   * Emits the updated sound card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: SoundCardDraft): void {
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
   * Updates the learning-language audio label.
   *
   * @param value - The new audio label text.
   * @remarks
   * In basic mode (not advanced), also syncs `audioLabelLexeme` from the text
   * using `syncLexemePrimaryFromText()`.
   */
  updateAudioLabelLearning(value: string): void {
    const draft = this.draft();
    const nextDraft = { ...draft, audioLabelLearning: value };

    if (!this.isAdvanced()) {
      nextDraft.audioLabelLexeme = syncLexemePrimaryFromText(
        draft.audioLabelLexeme,
        value,
        this.knownLanguage(),
        this.learningLanguage(),
      );
    }

    this.updateDraft(nextDraft);
  }

  /**
   * Handles state changes from the options editor.
   *
   * @param state - The updated options editor state.
   * @remarks
   * Updates `optionsKnown`, `optionsLexemes`, and `correctIndex` on the draft.
   */
  onOptionsStateChange(state: CardOptionsEditorState): void {
    this.updateDraft({
      ...this.draft(),
      optionsKnown: state.options,
      optionsLexemes: state.lexemes,
      correctIndex: state.correctIndex,
    });
  }
}
