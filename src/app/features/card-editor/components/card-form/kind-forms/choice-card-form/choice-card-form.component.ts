import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import type { CardOptionsEditorState } from '../../../../utils/options/card-options-editor.utils';
import type { ChoiceCardDraft } from '../../../../types';
export type { ChoiceCardDraft } from '../../../../types';
import { CardOptionsEditorComponent } from '../../../card-options-editor/card-options-editor.component';
import {
  resolveChoiceOptionsConfig,
  resolveChoiceOptionTexts,
  resolveChoiceOptionLexemes,
  applyChoiceOptionsState,
} from '../../../../utils/options';

/**
 * Form component for choice-type cards (select, reading, timed, symbol, tone).
 * Manages the prompt, answer options, and correct index selection.
 * @remarks Delegates option management to `CardOptionsEditorComponent`.
 */
@Component({
  selector: 'app-choice-card-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatRadioModule, CardOptionsEditorComponent],
  templateUrl: './choice-card-form.component.html',
  styleUrl: './choice-card-form.component.scss',
})
export class ChoiceCardFormComponent {
  /** Required choice card draft (select, reading, timed, symbol, or tone). */
  readonly draft = input.required<ChoiceCardDraft>();

  /** Whether to hide the prompt field. Kept for create-wizard compatibility. */
  readonly hidePrompt = input(false);

  /** Emits the updated choice card draft when the user makes changes. */
  readonly draftChange = output<ChoiceCardDraft>();

  /** Computed tone card draft, or null if the current kind is not 'tone'. */
  readonly toneDraft = computed(() => {
    const draft = this.draft();
    return draft.kind === 'tone' ? draft : null;
  });

  /**
   * Emits the updated choice card draft.
   *
   * @param next - The updated draft.
   */
  updateDraft(next: ChoiceCardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the index of the correct option.
   *
   * @param index - The zero-based index of the correct option.
   */
  updateCorrectIndex(index: number): void {
    this.updateDraft({ ...this.draft(), correctIndex: index });
  }

  /**
   * Handles state changes from the options editor.
   *
   * @param state - The updated options editor state.
   */
  onOptionsStateChange(state: CardOptionsEditorState): void {
    const draft = this.draft();
    this.updateDraft(applyChoiceOptionsState(draft, state));
  }

  /**
   * Returns the option texts based on card kind.
   * @remarks Delegates to `resolveChoiceOptionTexts` utility.
   */
  readonly optionTexts = computed(() => resolveChoiceOptionTexts(this.draft()));

  /**
   * Returns the lexeme drafts based on card kind.
   * @remarks Delegates to `resolveChoiceOptionLexemes` utility.
   */
  readonly optionLexemes = computed(() => resolveChoiceOptionLexemes(this.draft()));

  /**
   * Returns the options editor configuration based on card kind.
   * @remarks Delegates to `resolveChoiceOptionsConfig` utility.
   */
  readonly optionsConfig = computed(() => resolveChoiceOptionsConfig(this.draft()));
}
