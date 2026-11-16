import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { CardKind } from '../../../../entities/card/model';
import type { CardDraft, ChoiceCardDraft } from '../../types';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';

/**
 * Question tab component for the card form.
 *
 * @remarks
 * Handles card title and choice-type prompt fields only.
 * Language pair and course hierarchy are managed by CardConnectionsTab.
 */
@Component({
  selector: 'app-card-form-question-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './card-form-question-tab.component.html',
})
export class CardFormQuestionTabComponent {
  /** Required card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Emits the updated title. */
  readonly titleChange = output<string>();

  /** Emits the updated choice prompt known. */
  readonly choicePromptKnownChange = output<string>();

  /** Computed choice card draft, or null if not a choice type. */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    const kind = draft.kind as CardKind;
    if (kind === 'code-select') {
      return null;
    }
    if (cardFormKindGroup(kind) === 'choice') {
      return draft as unknown as ChoiceCardDraft;
    }
    return null;
  });

  updateTitle(title: string): void {
    this.titleChange.emit(title);
  }

  updateChoicePromptKnown(promptKnown: string): void {
    this.choicePromptKnownChange.emit(promptKnown);
  }
}
