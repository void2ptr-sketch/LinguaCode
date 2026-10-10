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

/**
 * Form component for memory/pairs cards. Manages known-learning word pairs with lexeme sync.
 * @remarks Supports up to 12 pairs; auto-syncs lexemes in basic mode.
 */
@Component({
  selector: 'app-pairs-card-form',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './pairs-card-form.component.html',
  styleUrl: './pairs-card-form.component.scss',
})
export class PairsCardFormComponent {
  /** Required memory card draft. */
  readonly draft = input.required<MemoryCardDraft>();
  /** Known (source) language for lexeme sync. */
  readonly knownLanguage = input<ContentLanguage>('ru');
  /** Learning (target) language for lexeme sync. */
  readonly learningLanguage = input<ContentLanguage>('en');
  /** Whether the editor is in advanced mode (disables auto-lexeme sync). */
  readonly isAdvanced = input(false);

  /** Emits the updated memory card draft when the user makes changes. */
  readonly draftChange = output<MemoryCardDraft>();

  /**
   * Emits the updated memory card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: MemoryCardDraft): void {
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
   * Updates a pair at the given index.
   *
   * @param index - The zero-based index of the pair to update.
   * @param side - The side to update ('known' or 'learning').
   * @param value - The new value for the pair.
   * @remarks
   * In basic mode (not advanced), auto-syncs `learningLexeme` from the learning text.
   */
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

  /**
   * Adds a new memory pair.
   * @remarks
   * Respects the maximum of 12 pairs. Creates an empty `MemoryPairDraft`.
   */
  addPair(): void {
    const draft = this.draft();
    if (draft.pairs.length >= 12) {
      return;
    }

    this.updateDraft({ ...draft, pairs: [...draft.pairs, emptyMemoryPairDraft()] });
  }

  /**
   * Removes a pair at the given index.
   *
   * @param index - The zero-based index of the pair to remove.
   * @remarks
   * Respects the minimum of 1 pair.
   */
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
