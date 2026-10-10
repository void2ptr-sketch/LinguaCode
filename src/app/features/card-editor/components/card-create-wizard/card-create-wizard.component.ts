import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import type { ContentLanguage } from '../../../../core/models';
import { CARD_KIND_LABELS } from '../../types';
import { cardFormKindGroup } from '../../utils/card-form.registry';
import { editorVariantLabel } from '../../utils/card-kind-index-meta.utils';
import type { CardDraft, MemoryCardDraft, SoundCardDraft } from '../../types';
import { ChoiceCardFormComponent } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from '../card-form/kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from '../card-form/kind-forms/pairs-card-form/pairs-card-form.component';
import type { ChoiceCardDraft } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import type { InputCardDraft } from '../card-form/kind-forms/input-card-form/input-card-form.component';

/**
 * Card creation wizard component. Guides users through a multi-step form to create a new card,
 * dynamically rendering the appropriate kind-specific form based on the draft's card kind.
 * @remarks Supports basic and advanced UX modes; delegates to kind-specific form components.
 */
@Component({
  selector: 'app-card-create-wizard',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatStepperModule,
    ChoiceCardFormComponent,
    InputCardFormComponent,
    MediaCardFormComponent,
    PairsCardFormComponent,
  ],
  templateUrl: './card-create-wizard.component.html',
  styleUrl: './card-create-wizard.component.scss',
})
export class CardCreateWizardComponent {
  /** Required card draft being created. */
  readonly draft = input.required<CardDraft>();
  /** Known (source) language for the card content. */
  readonly knownLanguage = input<ContentLanguage>('ru');
  /** Learning (target) language for the card content. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated card draft when the user makes changes. */
  readonly draftChange = output<CardDraft>();
  /** Emits when the user requests to expand to the full editor. */
  readonly expandToFull = output<void>();

  /** Labels for all card kinds. */
  readonly kindLabels = CARD_KIND_LABELS;

  /**
   * Computed kind group (e.g., 'choice', 'input', 'code-select') for the current draft.
   * @remarks
   * Determines which kind-specific form stepper is rendered.
   */
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  /**
   * Computed hint label for the editor variant.
   * @remarks
   * Provides contextual help text for the current card kind.
   */
  readonly variantHint = computed(() => editorVariantLabel(this.draft().kind));

  /**
   * Whether the draft has a `promptKnown` field.
   * @remarks
   * Used to conditionally render the prompt input in the wizard.
   */
  readonly hasPrompt = computed(() => 'promptKnown' in this.draft());

  /**
   * Computed value of `promptKnown` for the current draft.
   * @remarks
   * Returns empty string for drafts without `promptKnown`.
   */
  readonly promptKnownValue = computed(() => {
    const draft = this.draft();
    return 'promptKnown' in draft ? draft.promptKnown : '';
  });

  /**
   * Computed choice card draft, or null if the current kind is not a choice card.
   * @remarks
   * Used to conditionally render `ChoiceCardFormComponent` in the wizard.
   */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    return this.kindGroup() === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  /**
   * Computed input card draft, or null if the current kind is not an input card.
   * @remarks
   * Used to conditionally render `InputCardFormComponent` in the wizard.
   */
  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return this.kindGroup() === 'input' ? (draft as InputCardDraft) : null;
  });

  /**
   * Computed memory card draft, or null if the current kind is not 'memory'.
   * @remarks
   * Used to conditionally render `PairsCardFormComponent` in the wizard.
   */
  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  /**
   * Computed sound card draft, or null if the current kind is not 'sound'.
   * @remarks
   * Used to conditionally render `MediaCardFormComponent` in the wizard.
   */
  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  /**
   * Emits the updated card draft.
   *
   * @param next - The updated card draft.
   */
  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  /**
   * Updates the draft title.
   *
   * @param title - The new title for the card.
   */
  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  /**
   * Updates the `promptKnown` field if present on the draft.
   *
   * @param value - The new prompt text.
   * @remarks
   * No-op for drafts without a `promptKnown` field (e.g., code-select, draw).
   */
  updatePromptKnown(value: string): void {
    const draft = this.draft();
    if (!('promptKnown' in draft)) {
      return;
    }

    this.updateDraft({ ...draft, promptKnown: value });
  }
}
