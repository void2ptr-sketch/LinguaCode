import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { primaryHanCharacter } from '../../../../../../core/data/draw-stroke-guides.data';
import { syncLexemePrimaryFromText } from '../../../../utils/card-editor-ux.utils';
import type { ContentLanguage } from '../../../../../../core/models';
import type { DrawCardDraft, KeyboardCardDraft } from '../../../../types';

export type InputCardDraft = KeyboardCardDraft | DrawCardDraft;

@Component({
  selector: 'app-input-card-form',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './input-card-form.component.html',
  styleUrl: './input-card-form.component.scss',
})
export class InputCardFormComponent {
  readonly draft = input.required<InputCardDraft>();
  readonly hidePrompt = input(false);
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');

  readonly draftChange = output<InputCardDraft>();

  readonly keyboardDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'keyboard' ? draft : null;
  });

  readonly drawDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'draw' ? draft : null;
  });

  updateDraft(next: InputCardDraft): void {
    this.draftChange.emit(next);
  }

  updatePromptKnown(value: string): void {
    this.updateDraft({ ...this.draft(), promptKnown: value });
  }

  updateReferenceHintKnown(value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'draw') {
      return;
    }

    this.updateDraft({ ...draft, referenceHintKnown: value });
  }

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

  updateKeyboardAnswer(index: number, value: string): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard') {
      return;
    }

    const acceptedAnswersKnown = [...draft.acceptedAnswersKnown];
    acceptedAnswersKnown[index] = value;
    this.updateDraft({ ...draft, acceptedAnswersKnown });
  }

  addKeyboardAnswer(): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length >= 8) {
      return;
    }

    this.updateDraft({ ...draft, acceptedAnswersKnown: [...draft.acceptedAnswersKnown, ''] });
  }

  removeKeyboardAnswer(index: number): void {
    const draft = this.draft();
    if (draft.kind !== 'keyboard' || draft.acceptedAnswersKnown.length <= 1) {
      return;
    }

    this.updateDraft({
      ...draft,
      acceptedAnswersKnown: draft.acceptedAnswersKnown.filter((_, answerIndex) => answerIndex !== index),
    });
  }
}
