import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { LexemeDraftFields } from '../../../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';
import { syncLexemePrimaryFromText } from '../../../../utils/ux/card-editor-ux.utils';
import type { ContentLanguage } from '../../../../../../entities/card/model';
import type { CardOptionsEditorState } from '../../../../utils/options/card-options-editor.utils';
import type { SoundCardDraft } from '../../../../types';
import { CardOptionsEditorComponent } from '../../../card-options-editor/card-options-editor.component';
import { LexemeFieldsComponent } from '../../../lexeme-fields/lexeme-fields.component';

/**
 * Answer editor for sound/media cards.
 *
 * @remarks
 * Manages the audio label, its learning lexeme, known options, and option
 * lexemes. The prompt field lives in the content tab.
 */
@Component({
  selector: 'app-media-card-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    CardOptionsEditorComponent,
    LexemeFieldsComponent,
  ],
  templateUrl: './media-card-form.component.html',
})
export class MediaCardFormComponent {
  /** Required sound card draft. */
  readonly draft = input.required<SoundCardDraft>();

  /** Known (source) language for lexeme sync. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for lexeme sync. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Whether the editor is in advanced mode (disables auto-lexeme sync). */
  readonly isAdvanced = input(false);

  /** Emits the updated sound card draft when the user makes changes. */
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
   * Updates the audio label lexeme.
   *
   * @param fields - The new lexeme draft fields.
   */
  updateAudioLabelLexeme(fields: LexemeDraftFields): void {
    this.updateDraft({ ...this.draft(), audioLabelLexeme: fields });
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
