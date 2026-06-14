import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import type { ContentLanguage } from '../../../../core/models';
import type { CardAppearance } from '../../../../core/models/card.types';
import { DEFAULT_TONE_OPTIONS } from '../../../../core/data/tone-mark.utils';
import { Card } from '../../../../core/models';
import type { ChoiceCardDraft } from './kind-forms/choice-card-form/choice-card-form.component';
import type { InputCardDraft } from './kind-forms/input-card-form/input-card-form.component';
import { CardDraft, DEFAULT_CARD_DIRECTION, type MemoryCardDraft, type SoundCardDraft } from '../../types';
import type { CardEditorUxMode } from '../../utils/card-editor-ux.utils';
import { cardFormKindGroup } from '../../utils/card-form.registry';
import { normalizeCardDraft } from '../../utils/card-validation.utils';
import { CardFormPhoneticsPanelComponent } from '../card-form-phonetics-panel/card-form-phonetics-panel.component';
import { CardFormSettingsPanelComponent } from '../card-form-settings-panel/card-form-settings-panel.component';
import { CardPreviewComponent } from '../card-preview/card-preview.component';
import { ChoiceCardFormComponent } from './kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from './kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from './kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from './kind-forms/pairs-card-form/pairs-card-form.component';

@Component({
  selector: 'app-card-form',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    CardFormPhoneticsPanelComponent,
    CardFormSettingsPanelComponent,
    CardPreviewComponent,
    ChoiceCardFormComponent,
    InputCardFormComponent,
    MediaCardFormComponent,
    PairsCardFormComponent,
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss',
})
export class CardFormComponent {
  readonly draft = input.required<CardDraft>();
  readonly previewId = input('preview-card');
  readonly editorUxMode = input<CardEditorUxMode>('basic');
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');
  readonly defaultAppearance = input<CardAppearance>({ theme: 'azure-blue', fontSize: 'md' });

  readonly draftChange = output<CardDraft>();

  readonly isAdvanced = computed(() => this.editorUxMode() === 'advanced');
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  readonly effectiveAppearance = computed(() =>
    this.isAdvanced() ? this.draft().appearance : this.defaultAppearance(),
  );

  readonly draftForPreview = computed(() => ({
    ...this.draft(),
    appearance: this.effectiveAppearance(),
  }));

  readonly previewCard = computed((): Card => {
    return (
      normalizeCardDraft(this.draftForPreview(), this.previewId()) ??
      this.fallbackPreviewCard(this.draftForPreview())
    );
  });

  readonly previewFontSize = computed(() => this.effectiveAppearance().fontSize);

  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    return cardFormKindGroup(draft.kind) === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return cardFormKindGroup(draft.kind) === 'input' ? (draft as InputCardDraft) : null;
  });

  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  updateDraft(nextDraft: CardDraft): void {
    this.draftChange.emit(nextDraft);
  }

  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  private fallbackPreviewCard(draft: CardDraft): Card {
    const appearance = draft.appearance;

    switch (draft.kind) {
      case 'select':
        return {
          id: this.previewId(),
          kind: 'select',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          optionsLearning: ['Вариант 1', 'Вариант 2'],
          correctIndex: 0,
          appearance,
        };
      case 'memory':
        return {
          id: this.previewId(),
          kind: 'memory',
          title: draft.title || 'Новая карточка',
          promptKnown: draft.promptKnown || 'Подсказка',
          pairs: [{ known: 'A', learning: 'B' }],
          appearance,
        };
      case 'symbol':
        return {
          id: this.previewId(),
          kind: 'symbol',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          symbols: ['👋', '🔥'],
          correctIndex: 0,
          appearance,
        };
      case 'sound':
        return {
          id: this.previewId(),
          kind: 'sound',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          audioLabelLearning: draft.audioLabelLearning || 'Hello',
          optionsKnown: ['Привет', 'Пока'],
          correctIndex: 0,
          appearance,
        };
      case 'timed':
        return {
          id: this.previewId(),
          kind: 'timed',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          optionsLearning: ['A', 'B'],
          correctIndex: 0,
          timeLimitSec: draft.timeLimitSec || 30,
          appearance,
        };
      case 'keyboard':
        return {
          id: this.previewId(),
          kind: 'keyboard',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Подсказка',
          acceptedAnswersKnown: ['ответ'],
          appearance,
        };
      case 'draw':
        return {
          id: this.previewId(),
          kind: 'draw',
          title: draft.title || 'Новая карточка',
          promptKnown: draft.promptKnown || 'Подсказка',
          referenceHintKnown: draft.referenceHintKnown || 'Ориентир',
          practiceMode: draft.practiceMode ?? 'freehand',
          targetCharacter: draft.targetCharacter || draft.promptLexeme?.primary || '',
          radicalHint: draft.radicalHint,
          strokeGuides: draft.strokeGuides,
          appearance,
        };
      case 'tone':
        return {
          id: this.previewId(),
          kind: 'tone',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Какой тон?',
          syllableBase: draft.syllableBase || 'ma',
          toneOptions: [...DEFAULT_TONE_OPTIONS],
          correctIndex: 0,
          appearance,
        };
      case 'reading':
        return {
          id: this.previewId(),
          kind: 'reading',
          title: draft.title || 'Новая карточка',
          direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
          promptKnown: draft.promptKnown || 'Какое чтение?',
          optionsLearning: ['xíng', 'háng'],
          correctIndex: 0,
          appearance,
        };
    }
  }
}
