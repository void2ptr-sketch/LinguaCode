import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { ContentLanguage } from '../../../../../../core/models';
import type { MemoryCardDraft } from '../../../../types';
import { emptyMemoryPairDraft } from '../../../../types';
import { syncLexemePrimaryFromText } from '../../../../utils/card-editor-ux.utils';

@Component({
  selector: 'app-pairs-card-form',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './pairs-card-form.component.html',
  styleUrl: './pairs-card-form.component.scss',
})
export class PairsCardFormComponent {
  readonly draft = input.required<MemoryCardDraft>();
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');
  readonly isAdvanced = input(false);

  readonly draftChange = output<MemoryCardDraft>();

  updateDraft(next: MemoryCardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptKnown(value: string): void {
    this.updateDraft({ ...this.draft(), promptKnown: value });
  }

  updatePair(index: number, side: 'known' | 'learning', value: string): void {
    const draft = this.draft();
    const pairs = draft.pairs.map((pair, pairIndex) => {
      if (pairIndex !== index) {
        return pair;
      }

      if (side === 'learning' && !this.isAdvanced()) {
        return {
          ...pair,
          learning: value,
          learningLexeme: syncLexemePrimaryFromText(
            pair.learningLexeme,
            value,
            this.knownLanguage(),
            this.learningLanguage(),
          ),
        };
      }

      return { ...pair, [side]: value };
    });

    this.updateDraft({ ...draft, pairs });
  }

  addPair(): void {
    const draft = this.draft();
    if (draft.pairs.length >= 12) {
      return;
    }

    this.updateDraft({ ...draft, pairs: [...draft.pairs, emptyMemoryPairDraft()] });
  }

  removePair(index: number): void {
    const draft = this.draft();
    if (draft.pairs.length <= 1) {
      return;
    }

    this.updateDraft({
      ...draft,
      pairs: draft.pairs.filter((_, pairIndex) => pairIndex !== index),
    });
  }
}
