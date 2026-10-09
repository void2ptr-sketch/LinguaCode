import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { LexemeDraftFields } from '../../../../core/data/chinese/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../core/models';
import type { CardDraft, LexemeCardDraft } from '../../types';
import { LexemeFieldsComponent } from '../lexeme-fields/lexeme-fields.component';

/**
 * Phonetics panel component for card form. Manages prompt lexeme, audio URL, and audio label lexeme fields.
 * @remarks Conditionally shows lexeme fields based on card kind (hidden for tone and code-select).
 */
@Component({
  selector: 'app-card-form-phonetics-panel',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    LexemeFieldsComponent,
  ],
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

  /** Whether to show the prompt lexeme field (hidden for tone and code-select cards). */
  readonly showPromptLexeme = computed(() => {
    const kind = this.draft().kind;
    return kind !== 'tone' && kind !== 'code-select';
  });

  /** Computed prompt lexeme draft, or null for code-select cards. */
  readonly promptLexemeDraft = computed((): (LexemeCardDraft & CardDraft) | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }

    return draft as LexemeCardDraft & CardDraft;
  });

  /** Computed sound card draft, or null if the current kind is not 'sound'. */
  readonly soundDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  /** Computed memory card draft, or null if the current kind is not 'memory'. */
  readonly memoryDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptLexeme(fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return;
    }

    this.updateDraft({ ...draft, promptLexeme: fields });
  }

  updateAudioUrl(value: string): void {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return;
    }

    this.updateDraft({ ...draft, audioUrl: value });
  }

  updateAudioLabelLexeme(fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (draft.kind === 'sound') {
      this.updateDraft({ ...draft, audioLabelLexeme: fields });
    }
  }

  updatePairLexeme(index: number, fields: LexemeDraftFields): void {
    const draft = this.draft();
    if (draft.kind !== 'memory') {
      return;
    }

    const pairs = draft.pairs.map((pair, pairIndex) => {
      if (pairIndex !== index) {
        return pair;
      }

      const learning = fields.primary.trim() ? fields.primary : pair.learning;
      return { ...pair, learning, learningLexeme: fields };
    });

    this.updateDraft({ ...draft, pairs });
  }
}
