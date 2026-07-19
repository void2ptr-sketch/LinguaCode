import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import type { ContentLanguage } from '../../../../core/models';
import type { CardAppearance } from '../../../../core/models/card.types';
import { DEFAULT_TONE_OPTIONS } from '../../../../core/data/chinese/tone-mark.utils';
import { Card } from '../../../../core/models';
import type { ChoiceCardDraft } from './kind-forms/choice-card-form/choice-card-form.component';
import type { InputCardDraft } from './kind-forms/input-card-form/input-card-form.component';
import {
  CONTENT_LANGUAGE_LABELS,
} from '../../../../shared/card-catalog-search';
import { contentLanguages } from '../../../../core/data/language-pair/language-pair.utils';
import {
  CardDraft,
  DEFAULT_CARD_DIRECTION,
  type CodeSelectCardDraft,
  type MemoryCardDraft,
  type SoundCardDraft,
} from '../../types';
import { cardFormKindGroup } from '../../utils/card-form.registry';
import { normalizeCardDraft } from '../../utils/card-validation.utils';
import { CardFormPhoneticsPanelComponent } from '../card-form-phonetics-panel/card-form-phonetics-panel.component';
import { CardFormSettingsPanelComponent } from '../card-form-settings-panel/card-form-settings-panel.component';
import { CardPreviewComponent } from '../card-preview/card-preview.component';
import { CardOptionsEditorComponent } from '../card-options-editor/card-options-editor.component';
import { CodeSelectCardFormComponent } from './kind-forms/code-select-card-form/code-select-card-form.component';
import { ChoiceCardFormComponent } from './kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from './kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from './kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from './kind-forms/pairs-card-form/pairs-card-form.component';
import { MatDividerModule } from '@angular/material/divider';
import type { LexemeDraftFields } from '../../../../core/data/chinese/lexeme-draft.utils';
import type { CardOptionsEditorState } from '../../utils/card-options-editor.utils';
import { emptyOptionLexemes } from '../../types';
import type { CardIndexMetaOverride } from '../../../../core/data/cards/card-index.mapper';
import { CardMetaFieldsComponent } from '../card-meta-fields/card-meta-fields.component';

interface TabDefinition {
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-card-form',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    CardFormPhoneticsPanelComponent,
    CardFormSettingsPanelComponent,
    CardPreviewComponent,
    CardOptionsEditorComponent,
    CodeSelectCardFormComponent,
    ChoiceCardFormComponent,
    InputCardFormComponent,
    MediaCardFormComponent,
    PairsCardFormComponent,
    CardMetaFieldsComponent,
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss',
})
export class CardFormComponent {
  readonly draft = input.required<CardDraft>();
  readonly previewId = input('preview-card');
  readonly knownLanguage = input<ContentLanguage>('ru');
  readonly learningLanguage = input<ContentLanguage>('en');
  readonly defaultAppearance = input<CardAppearance>({ theme: 'azure-blue', fontSize: 'md' });
  readonly meta = input<CardIndexMetaOverride | undefined>(undefined);

  readonly draftChange = output<CardDraft>();
  readonly knownLanguageChange = output<ContentLanguage>();
  readonly learningLanguageChange = output<ContentLanguage>();
  readonly metaChange = output<CardIndexMetaOverride | undefined>();

  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  readonly effectiveAppearance = computed(() => this.defaultAppearance());

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

  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }

    return cardFormKindGroup(draft.kind) === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  readonly codeSelectDraft = computed((): CodeSelectCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'code-select' ? draft : null;
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

  // Tabs navigation state
  private readonly VISIBLE_TABS_COUNT = 3;
  private readonly tabOffset = signal(0);
  private readonly selectedTabLabel = signal<string | undefined>(undefined);

  /** Label of the currently active tab */
  readonly activeTabLabel = computed(() => {
    // Use explicitly selected tab, or fall back to the first visible tab
    return this.selectedTabLabel() ?? this.visibleTabs()[0]?.label ?? '';
  });

  updateDraft(nextDraft: CardDraft): void {
    this.draftChange.emit(nextDraft);
  }

  updateTitle(title: string): void {
    this.updateDraft({ ...this.draft(), title });
  }

  updateChoicePromptKnown(promptKnown: string): void {
    const draft = this.draft();
    if (draft.kind === 'select' || draft.kind === 'reading' || draft.kind === 'timed' || draft.kind === 'symbol') {
      this.updateDraft({ ...draft, promptKnown });
    }
  }

  onKnownLanguageChange(knownLanguage: ContentLanguage): void {
    this.knownLanguageChange.emit(knownLanguage);
    this.updateMeta({ ...this.meta(), knownLanguage });
  }

  onLearningLanguageChange(learningLanguage: ContentLanguage): void {
    this.learningLanguageChange.emit(learningLanguage);
    this.updateMeta({ ...this.meta(), learningLanguage });
  }

  choiceOptionsConfig() {
    const draft = this.choiceDraft();
    if (!draft) {
      return { title: '', optionLabelPrefix: '', showCorrectRadio: true };
    }

    switch (draft.kind) {
      case 'reading':
        return { title: 'Варианты чтения', optionLabelPrefix: 'Чтение', showCorrectRadio: true };
      case 'symbol':
        return { title: 'Символы', optionLabelPrefix: 'Символ', showCorrectRadio: true };
      case 'select':
        return { title: 'Варианты (известный)', optionLabelPrefix: 'Ответ', showCorrectRadio: true };
      case 'timed':
        return { title: 'Варианты (новый)', optionLabelPrefix: 'Новый', showCorrectRadio: true };
      default:
        return { title: 'Варианты', optionLabelPrefix: 'Вариант', showCorrectRadio: true };
    }
  }

  choiceOptionTexts(): readonly string[] {
    const draft = this.choiceDraft();
    if (!draft) {
      return [];
    }

    if (draft.kind === 'symbol') {
      return draft.symbols;
    }

    if (draft.kind === 'tone') {
      return [];
    }

    // Для select карточек показываем optionsKnown, а не optionsLearning
    if (draft.kind === 'select') {
      return draft.optionsKnown;
    }

    return draft.optionsLearning;
  }

  choiceOptionLexemes(): readonly LexemeDraftFields[] {
    const draft = this.choiceDraft();
    if (!draft) {
      return [];
    }

    if (draft.kind === 'symbol') {
      return draft.symbolLexemes;
    }

    if (draft.kind === 'tone') {
      return [];
    }

    // Для select карточек показываем lexemes для optionsKnown
    if (draft.kind === 'select') {
      return draft.optionsLexemes || emptyOptionLexemes(draft.optionsKnown.length);
    }

    return draft.optionsLexemes;
  }

  onChoiceOptionsStateChange(state: CardOptionsEditorState): void {
    const draft = this.choiceDraft();
    if (!draft) {
      return;
    }

    if (draft.kind === 'select') {
      this.updateDraft({
        ...draft,
        optionsKnown: state.options,
        optionsLexemes: state.lexemes,
        correctIndex: state.correctIndex,
      });
    } else if (draft.kind === 'reading' || draft.kind === 'timed') {
      this.updateDraft({
        ...draft,
        optionsLearning: state.options,
        optionsLexemes: state.lexemes,
        correctIndex: state.correctIndex,
      });
    } else if (draft.kind === 'symbol') {
      this.updateDraft({
        ...draft,
        symbols: state.options,
        symbolLexemes: state.lexemes,
        correctIndex: state.correctIndex,
      });
    }
  }

  // Tabs navigation methods
  get allAvailableTabs(): TabDefinition[] {
    const tabs: TabDefinition[] = [
      { label: 'Вопрос', visible: true },
      { label: 'Ответы', visible: true },
    ];

    // Контент показывается только для choice-карточек
    if (this.choiceDraft() !== null) {
      tabs.push({ label: 'Контент', visible: true });
    }

    // Фонетика не показывается для code-select
    if (this.draft().kind !== 'code-select') {
      tabs.push({ label: 'Фонетика', visible: true });
    }

    tabs.push({ label: 'Метаинфо', visible: true });
    tabs.push({ label: 'Настройки', visible: true });

    return tabs;
  }

  get MAX_TAB_OFFSET(): number {
    return Math.max(0, this.allAvailableTabs.length - this.VISIBLE_TABS_COUNT);
  }

  readonly visibleTabs = computed((): TabDefinition[] => {
    const offset = this.tabOffset();
    return this.allAvailableTabs.slice(offset, offset + this.VISIBLE_TABS_COUNT);
  });

  get tabGroupSelectedIndex(): number {
    return 0; // Всегда показываем первую видимую закладку
  }

  canPrevTabs(): boolean {
    return this.tabOffset() > 0;
  }

  canNextTabs(): boolean {
    return this.tabOffset() < this.MAX_TAB_OFFSET;
  }

  prevTabs(): void {
    if (this.canPrevTabs()) {
      this.tabOffset.update(n => n - 1);
      this.selectedTabLabel.set(undefined);
    }
  }

  nextTabs(): void {
    if (this.canNextTabs()) {
      this.tabOffset.update(n => n + 1);
      this.selectedTabLabel.set(undefined);
    }
  }

  onTabChange(tabLabel: string): void {
    this.selectedTabLabel.set(tabLabel);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevTabs();
    } else if (event.ctrlKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextTabs();
    }
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
          optionsKnown: ['Answer 1', 'Answer 2'],
          correctIndex: 0,
          appearance,
        };
      case 'code-select':
        return {
          id: this.previewId(),
          kind: 'code-select',
          title: draft.title || 'Новая карточка',
          caption: draft.caption || undefined,
          prompt: {
            code: draft.prompt.code || 'print "Hello";',
            language: draft.prompt.language,
          },
          options: draft.options.map((option, index) => ({
            code: option.code || `// option ${index + 1}`,
            language: option.language,
          })),
          correctIndex: draft.correctIndex,
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
          optionsLearning: ['银行', 'yínxíng'],
          correctIndex: 0,
          appearance,
        };
    }
  }

  updateMeta(next: CardIndexMetaOverride): void {
    this.metaChange.emit(next);
  }
}
