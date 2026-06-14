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
  readonly draft = input.required<CardDraft>();
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');

  readonly draftChange = output<CardDraft>();
  readonly expandToFull = output<void>();

  readonly kindLabels = CARD_KIND_LABELS;
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));
  readonly variantHint = computed(() => editorVariantLabel(this.draft().kind));
  readonly hasPrompt = computed(() => 'promptKnown' in this.draft());
  readonly promptKnownValue = computed(() => {
    const draft = this.draft();
    return 'promptKnown' in draft ? draft.promptKnown : '';
  });

  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    return this.kindGroup() === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return this.kindGroup() === 'input' ? (draft as InputCardDraft) : null;
  });

  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  updateDraft(next: CardDraft): void {
    this.draftChange.emit(next);
  }

  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  updatePromptKnown(value: string): void {
    const draft = this.draft();
    if (!('promptKnown' in draft)) {
      return;
    }

    this.updateDraft({ ...draft, promptKnown: value });
  }
}
