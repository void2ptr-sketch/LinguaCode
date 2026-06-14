import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { syncLexemePrimaryFromText } from '../../../../utils/card-editor-ux.utils';
import type { ContentLanguage } from '../../../../../../core/models';
import type { CardOptionsEditorState } from '../../../../utils/card-options-editor.utils';
import type { SoundCardDraft } from '../../../../types';
import { CardOptionsEditorComponent } from '../../../card-options-editor/card-options-editor.component';

@Component({
  selector: 'app-media-card-form',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, CardOptionsEditorComponent],
  templateUrl: './media-card-form.component.html',
})
export class MediaCardFormComponent {
  readonly draft = input.required<SoundCardDraft>();
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');
  readonly isAdvanced = input(false);

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
