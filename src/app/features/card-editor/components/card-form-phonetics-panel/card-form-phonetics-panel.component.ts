import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { LexemeDraftFields } from '../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../entities/card/model';
import type { CardDraft } from '../../types';
import { LexemeFieldsComponent } from '../lexeme-fields/lexeme-fields.component';

/**
 * Prompt phonetics panel component for card form.
 *
 * @remarks
 * Manages only prompt-side lexeme fields and the audio URL. Answer-side
 * lexemes (sound labels and memory pairs) live in the answers tab.
 */
@Component({
  selector: 'app-card-form-phonetics-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, LexemeFieldsComponent],
  templateUrl: './card-form-phonetics-panel.component.html',
  styleUrl: './card-form-phonetics-panel.component.scss',
})
export class CardFormPhoneticsPanelComponent {
  /** Required card draft being edited. */
  readonly draft = input.required<CardDraft>();
  /** Known (source) language for lexeme display. */
  readonly knownLanguage = input<ContentLanguage>('ru');
  /** Learning (target) language for lexeme display. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated card draft when phonetics fields change. */
  readonly draftChange = output<CardDraft>();

  /** Computed prompt lexeme draft, or null for kinds without prompt lexemes. */
  readonly promptLexemeDraft = computed(() => {
    const draft = this.draft();
    return 'promptLexeme' in draft ? draft : null;
  });

  /** Whether the prompt lexeme field should be shown. */
  readonly showPromptLexeme = computed(() => this.promptLexemeDraft() !== null);

  /**
   * Emits the updated card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the prompt lexeme fields.
   *
   * @param fields - The new lexeme draft fields.
   */
  updatePromptLexeme(fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (!('promptLexeme' in draft)) {
      return;
    }

    this.updateDraft({ ...draft, promptLexeme: fields });
  }

  /**
   * Updates the audio URL for the card.
   *
   * @param value - The new audio URL.
   */
  updateAudioUrl(value: string): void {
    const draft = this.draft();
    if (!('audioUrl' in draft)) {
      return;
    }

    this.updateDraft({ ...draft, audioUrl: value });
  }
}
