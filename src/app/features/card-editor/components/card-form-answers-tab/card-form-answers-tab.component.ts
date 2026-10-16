import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ContentLanguage } from '../../../../entities/card/model';
import type { CardDraft, ChoiceCardDraft, CodeSelectCardDraft, MemoryCardDraft, SoundCardDraft } from '../../types';
import type { InputCardDraft } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';
import { CodeSelectCardFormComponent } from '../card-form/kind-forms/code-select-card-form/code-select-card-form.component';
import { ChoiceCardFormComponent } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from '../card-form/kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from '../card-form/kind-forms/pairs-card-form/pairs-card-form.component';

/**
 * Tab component for editing card answers.
 *
 * @remarks
 * Delegates to kind-specific form components based on the draft's card type:
 * - `code-select` → CodeSelectCardFormComponent
 * - `choice` (select, reading, timed, symbol, tone) → ChoiceCardFormComponent
 * - `input` (keyboard, draw) → InputCardFormComponent
 * - `memory` → PairsCardFormComponent
 * - `sound` → MediaCardFormComponent
 */
@Component({
  selector: 'app-card-form-answers-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CodeSelectCardFormComponent,
    ChoiceCardFormComponent,
    InputCardFormComponent,
    MediaCardFormComponent,
    PairsCardFormComponent,
  ],
  templateUrl: './card-form-answers-tab.component.html',
  styleUrl: './card-form-answers-tab.component.scss',
})
export class CardFormAnswersTabComponent {
  /** The card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Known (source) language for the card content. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for the card content. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Emits the updated card draft when changes are made. */
  readonly draftChange = output<CardDraft>();

  /** Computed kind group for the current draft. */
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  /** Computed choice card draft (select, reading, timed, symbol, tone). */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }
    return cardFormKindGroup(draft.kind) === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  /** Computed code-select card draft. */
  readonly codeSelectDraft = computed((): CodeSelectCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'code-select' ? draft : null;
  });

  /** Computed input card draft (keyboard, draw). */
  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return cardFormKindGroup(draft.kind) === 'input' ? (draft as InputCardDraft) : null;
  });

  /** Computed memory card draft. */
  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  /** Computed sound card draft. */
  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });
}
