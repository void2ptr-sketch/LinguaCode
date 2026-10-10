import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { primaryHanCharacter } from '../../../../../../core/repositories/chinese/drawing/draw-stroke-guides.data';
import { syncLexemePrimaryFromText } from '../../../../utils/card-editor-ux.utils';
import type { ContentLanguage } from '../../../../../../core/models';
import type { DrawCardDraft, KeyboardCardDraft } from '../../../../types';

export type InputCardDraft = KeyboardCardDraft | DrawCardDraft;

/**
 * Form component for input-type cards (keyboard and draw). Manages answer inputs,
 * reference hints, and Hanzi target character for draw cards.
 * @remarks Syncs lexeme primary from text for draw cards.
 */
@Component({
  selector: 'app-input-card-form',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './input-card-form.component.html',
  styleUrl: './input-card-form.component.scss',
})
export class InputCardFormComponent {
  /** Required input card draft (keyboard or draw). */
  readonly draft = input.required<InputCardDraft>();
  /** Whether to hide the prompt field. */
  readonly hidePrompt = input(false);
  /** Known (source) language for lexeme sync. */
  readonly knownLanguage = input<ContentLanguage>('ru');
  /** Learning (target) language for lexeme sync. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated input card draft when the user makes changes. */
  readonly draftChange = output<InputCardDraft>();

  /**
   * Computed keyboard card draft, or null if the current kind is not 'keyboard'.
   * @remarks
   * Used to conditionally render keyboard-specific fields.
   */
  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  /**
   * Computed draw card draft, or null if the current kind is not 'draw'.
   * @remarks
   * Used to conditionally render draw-specific fields.
   */
  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  /**
   * Emits the updated input card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: InputCardDraft): void {
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
   * Updates the reference hint for draw cards.
   *
   * @param value - The new reference hint text.
   * @remarks
   * No-op for non-draw cards.
   */
  updateReferenceHintKnown(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'draw') {
      return;
    }

    this.updateDraft({ ...draft, referenceHintKnown: value });
  }

  /**
   * Updates the primary Hanzi character for draw cards.
   *
   * @param value - The new character string.
   * @remarks
   * Extracts the primary Han character, syncs `promptLexeme` via `syncLexemePrimaryFromText()`,
   * and sets `targetCharacter`. No-op for non-draw cards.
   */
  updateDrawPrimary(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'draw') {
      return;
    }

    const character = primaryHanCharacter(value) || value.trim();
    this.updateDraft({
      ...draft,
      promptLexeme: syncLexemePrimaryFromText(
        draft.promptLexeme,
        character,
        this.knownLanguage(),
        this.learningLanguage(),
      ),
      targetCharacter: character,
    });
  }

  /**
   * Updates a keyboard accepted answer.
   *
   * @param index - The zero-based index of the answer.
   * @param value - The new answer text.
   * @remarks
   * No-op for non-keyboard cards.
   */
  updateKeyboardAnswer(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard') {
      return;
    }

    const acceptedAnswersKnown = [...draft.acceptedAnswersKnown];
    acceptedAnswersKnown[index] = value;
    this.updateDraft({ ...draft, acceptedAnswersKnown });
  }

  /**
   * Adds a new accepted answer for keyboard cards.
   * @remarks
   * Respects the maximum of 8 answers. No-op for non-keyboard cards.
   */
  addKeyboardAnswer(): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, acceptedAnswersKnown: [...draft.acceptedAnswersKnown, ''] });
  }

  /**
   * Removes an accepted answer from keyboard cards.
   *
   * @param index - The zero-based index of the answer to remove.
   * @remarks
   * Respects the minimum of 1 answer. No-op for non-keyboard cards.
   */
  removeKeyboardAnswer(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length <= 1) {
      return;
    }

    this.updateDraft({
      ...draft,
      acceptedAnswersKnown: draft.acceptedAnswersKnown.filter(
        (_, answerIndex) => answerIndex !== index,
      ),
    });
  }
}
