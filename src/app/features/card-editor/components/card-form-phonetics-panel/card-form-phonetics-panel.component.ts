import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { LexemeDraftFields } from '../../../../core/data/chinese/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../core/models';
import type { CardDraft, LexemeCardDraft } from '../../types';
import { LexemeFieldsComponent } from '../lexeme-fields/lexeme-fields.component';

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
  readonly draft = input.required<CardDraft>();
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');

  readonly draftChange = output<CardDraft>();

  readonly showPromptLexeme = computed(() => {
    const kind = this.draft().kind;
    return kind !== 'tone' && kind !== 'code-select';
  });

  readonly promptLexemeDraft = computed((): (LexemeCardDraft & CardDraft) | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }

    return draft as LexemeCardDraft & CardDraft;
  });

  readonly soundDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

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
