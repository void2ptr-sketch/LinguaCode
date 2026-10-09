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

  updateDraft(next: SoundCardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptKnown(value: string): void {
    this.updateDraft({ ...this.draft(), promptKnown: value });
  }

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

  onOptionsStateChange(state: CardOptionsEditorState): void {
    this.updateDraft({
      ...this.draft(),
      optionsKnown: state.options,
      optionsLexemes: state.lexemes,
      correctIndex: state.correctIndex,
    });
  }
}
