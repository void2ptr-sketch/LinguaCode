import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import type { ContentLanguage } from '../../../../core/models';
import type { CardAppearance } from '../../../../core/models/card.types';
import { DEFAULT_TONE_OPTIONS } from '../../../../core/domain/chinese/answers/tone-mark.utils';
import { Card } from '../../../../core/models';
import type { ChoiceCardDraft } from './kind-forms/choice-card-form/choice-card-form.component';
import type { InputCardDraft } from './kind-forms/input-card-form/input-card-form.component';
import { CONTENT_LANGUAGE_LABELS } from '../../../card-catalog-search';
import { contentLanguages } from '../../../../core/domain/language-pair/language-pair.utils';
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
import type { LexemeDraftFields } from '../../../../core/domain/chinese/phonetics/lexeme-draft.utils';
import type { CardOptionsEditorState } from '../../utils/card-options-editor.utils';
import { emptyOptionLexemes } from '../../types';
import type { CardIndexMetaOverride } from '../../../../core/repositories/cards/mapping/card-index.mapper';
import { CardMetaFieldsComponent } from '../card-meta-fields/card-meta-fields.component';
import {
  CardCatalogHierarchyService,
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../card-catalog-search/services/card-catalog-hierarchy/card-catalog-hierarchy.service';

/**
 * Tab definition for the card form navigation.
 */
type TabDefinition = {
  /** Display label for the tab. */
  label: string;
  /** Whether the tab is visible. */
  visible: boolean;
};

/**
 * Main form component for creating and editing cards.
 *
 * @remarks
 * Provides a tabbed interface for editing all aspects of a card draft:
 * question, answers, content, phonetics, metadata, and settings.
 * Loads course/lesson/scenario hierarchy for card association.
 * Delegates kind-specific editing to nested form components.
 *
 * @example
 * ```html
 * <app-card-form
 *   [draft]="cardDraft"
 *   [knownLanguage]="'zh'"
 *   [learningLanguage]="'en'"
 *   (draftChange)="onDraftChange($event)"
 *   (metaChange)="onMetaChange($event)">
 * </app-card-form>
 * ```
 */
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
export class CardFormComponent implements OnInit {
  private readonly hierarchyService = inject(CardCatalogHierarchyService);

  /** Required card draft being edited or created. */
  readonly draft = input.required<CardDraft>();

  /** Unique identifier for the preview card element. Defaults to 'preview-card'. */
  readonly previewId = input('preview-card');

  /** Known (source) language for the card content. Defaults to 'ru'. */
  readonly knownLanguage = input<ContentLanguage>('ru');

  /** Learning (target) language for the card content. Defaults to 'en'. */
  readonly learningLanguage = input<ContentLanguage>('en');

  /** Default appearance settings (theme, font size) for the preview. */
  readonly defaultAppearance = input<CardAppearance>({ theme: 'azure-blue', fontSize: 'md' });

  /** Optional card index meta override for tags and hierarchy references. */
  readonly meta = input<CardIndexMetaOverride | undefined>(undefined);

  /** Emits the updated card draft when the user makes changes. */
  readonly draftChange = output<CardDraft>();

  /** Emits when the known language changes. */
  readonly knownLanguageChange = output<ContentLanguage>();

  /** Emits when the learning language changes. */
  readonly learningLanguageChange = output<ContentLanguage>();

  /** Emits the updated card index meta override. */
  readonly metaChange = output<CardIndexMetaOverride | undefined>();

  /** Available courses for the current language pair, loaded asynchronously. */
  readonly availableCourses = signal<readonly CourseOption[]>([]);

  /** Available lessons for the selected course, loaded asynchronously. */
  readonly availableLessons = signal<readonly LessonOption[]>([]);

  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = signal<readonly ScenarioOption[]>([]);

  /** Computed kind group ('choice', 'input', 'code-select') for the current draft. */
  readonly kindGroup = computed(() => cardFormKindGroup(this.draft().kind));

  /** Computed effective appearance (direct passthrough of default appearance input). */
  readonly effectiveAppearance = computed(() => this.defaultAppearance());

  /** Computed draft merged with effective appearance for preview rendering. */
  readonly draftForPreview = computed(() => ({
    ...this.draft(),
    appearance: this.effectiveAppearance(),
  }));

  /**
   * Computed normalized Card object for the preview.
   * @remarks
   * Falls back to a synthetic card via `fallbackPreviewCard` if normalization fails.
   */
  readonly previewCard = computed((): Card => {
    return (
      normalizeCardDraft(this.draftForPreview(), this.previewId()) ??
      this.fallbackPreviewCard(this.draftForPreview())
    );
  });

  /** Computed font size from the effective appearance. */
  readonly previewFontSize = computed(() => this.effectiveAppearance().fontSize);

  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  async ngOnInit(): Promise<void> {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    const pairKey = `${known}_${learning}`;
    const courses = await this.hierarchyService.loadCourses(known, learning, pairKey);
    this.availableCourses.set(courses);

    // Если у карточки уже выбран курс — загружаем уроки и сценарии
    const draft = this.draft();
    if (draft.courseId) {
      const lessons = await this.hierarchyService.loadLessons(draft.courseId);
      this.availableLessons.set(lessons);
    }
    if (draft.courseId && draft.lessonId) {
      const scenarios = this.hierarchyService.getScenariosForLesson(draft.courseId, draft.lessonId);
      this.availableScenarios.set(scenarios);
    }
  }

  /**
   * Computed choice card draft (select, reading, timed, symbol, tone).
   *
   * @remarks
   * Returns `null` for code-select cards and non-choice kinds.
   */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }

    return cardFormKindGroup(draft.kind) === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  /**
   * Computed code-select card draft, or `null` if the current draft is not a code-select card.
   */
  readonly codeSelectDraft = computed((): CodeSelectCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'code-select' ? draft : null;
  });

  /**
   * Computed input card draft (keyboard).
   *
   * @remarks
   * Returns `null` for non-input kinds.
   */
  readonly inputDraft = computed((): InputCardDraft | null => {
    const draft = this.draft();
    return cardFormKindGroup(draft.kind) === 'input' ? (draft as InputCardDraft) : null;
  });

  /**
   * Computed memory card draft, or `null` if the current draft is not a memory card.
   */
  readonly pairsDraft = computed((): MemoryCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'memory' ? draft : null;
  });

  /**
   * Computed sound card draft, or `null` if the current draft is not a sound card.
   */
  readonly mediaDraft = computed((): SoundCardDraft | null => {
    const draft = this.draft();
    return draft.kind === 'sound' ? draft : null;
  });

  // Tabs navigation state
  private readonly VISIBLE_TABS_COUNT = 3;
  private readonly tabOffset = signal(0);
  private readonly selectedTabLabel = signal<string | undefined>(undefined);

  /**
   * Label of the currently active tab.
   * @remarks
   * Uses explicitly selected tab, or falls back to the first visible tab.
   */
  readonly activeTabLabel = computed(() => {
    // Use explicitly selected tab, or fall back to the first visible tab
    return this.selectedTabLabel() ?? this.visibleTabs()[0]?.label ?? '';
  });

  /**
   * Emits the updated card draft when the user makes changes.
   *
   * @param nextDraft - The updated card draft.
   */
  updateDraft(nextDraft: CardDraft): void {
    this.draftChange.emit(nextDraft);
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
   * Updates the known-language prompt for choice-type cards.
   *
   * @param promptKnown - The new prompt text.
   */
  updateChoicePromptKnown(promptKnown: string): void {
    const draft = this.draft();
    if (
      draft.kind === 'select' ||
      draft.kind === 'reading' ||
      draft.kind === 'timed' ||
      draft.kind === 'symbol'
    ) {
      this.updateDraft({ ...draft, promptKnown });
    }
  }

  /**
   * Handles known language changes and emits the event.
   *
   * @param knownLanguage - The new known language.
   */
  onKnownLanguageChange(knownLanguage: ContentLanguage): void {
    this.knownLanguageChange.emit(knownLanguage);
    this.updateMeta({ ...this.meta(), knownLanguage });
  }

  /**
   * Handles learning language changes and emits the event.
   *
   * @param learningLanguage - The new learning language.
   */
  onLearningLanguageChange(learningLanguage: ContentLanguage): void {
    this.learningLanguageChange.emit(learningLanguage);
    this.updateMeta({ ...this.meta(), learningLanguage });
  }

  /**
   * Updates the selected course and loads associated lessons.
   *
   * @param courseId - The selected course ID (empty string to deselect).
   * @remarks
   * Resets lessons and scenarios. Loads lessons asynchronously if a course is selected.
   */
  async updateCourseId(courseId: string): Promise<void> {
    this.updateDraft({ ...this.draft(), courseId, lessonId: '', scenarioId: '' });
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (courseId) {
      const lessons = await this.hierarchyService.loadLessons(courseId);
      this.availableLessons.set(lessons);
    }
  }

  /**
   * Updates the selected lesson and loads associated scenarios.
   *
   * @param lessonId - The selected lesson ID (empty string to deselect).
   * @remarks
   * Resets scenarios. Loads scenarios asynchronously if a lesson is selected.
   */
  async updateLessonId(lessonId: string): Promise<void> {
    this.updateDraft({ ...this.draft(), lessonId, scenarioId: '' });
    this.availableScenarios.set([]);

    if (lessonId) {
      const courseId = this.draft().courseId;
      if (courseId) {
        const scenarios = this.hierarchyService.getScenariosForLesson(courseId, lessonId);
        this.availableScenarios.set(scenarios);
      }
    }
  }

  /**
   * Updates the selected scenario in the draft.
   *
   * @param scenarioId - The selected scenario ID.
   */
  updateScenarioId(scenarioId: string): void {
    this.updateDraft({ ...this.draft(), scenarioId });
  }

  /**
   * Returns configuration for the choice options editor based on card kind.
   *
   * @returns Configuration object with title, option label prefix, and showCorrectRadio flag.
   */
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
        return {
          title: 'Варианты (известный)',
          optionLabelPrefix: 'Ответ',
          showCorrectRadio: true,
        };
      case 'timed':
        return { title: 'Варианты (новый)', optionLabelPrefix: 'Новый', showCorrectRadio: true };
      default:
        return { title: 'Варианты', optionLabelPrefix: 'Вариант', showCorrectRadio: true };
    }
  }

  /**
   * Returns the option texts for the choice options editor.
   *
   * @returns Array of option text strings, or empty array for unsupported kinds.
   */
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

  /**
   * Returns the lexeme drafts for the choice options editor.
   *
   * @returns Array of lexeme draft fields, or empty array for unsupported kinds.
   */
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

  /**
   * Handles state changes from the choice options editor.
   *
   * @param state - The updated options editor state.
   * @remarks
   * Updates the draft with new options, lexemes, and correct index
   * based on the card kind (select, reading, timed, symbol).
   */
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

  /**
   * All available tabs in the card form.
   * @remarks
   * Dynamically includes/excludes tabs based on card kind:
   * - 'Content' tab is shown only for choice-type cards
   * - 'Phonetics' tab is hidden for code-select cards
   */
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

  /** Maximum tab offset for horizontal scrolling. */
  get MAX_TAB_OFFSET(): number {
    return Math.max(0, this.allAvailableTabs.length - this.VISIBLE_TABS_COUNT);
  }

  /**
   * Currently visible tabs (windowed by tab offset).
   * @remarks
   * Shows up to `VISIBLE_TABS_COUNT` tabs at a time, scrollable via `prevTabs`/`nextTabs`.
   */
  readonly visibleTabs = computed((): TabDefinition[] => {
    const offset = this.tabOffset();
    return this.allAvailableTabs.slice(offset, offset + this.VISIBLE_TABS_COUNT);
  });

  /**
   * Currently selected tab index (always 0 — tabs scroll, don't switch by index).
   */
  readonly tabGroupSelectedIndex = 0;

  /**
   * Checks whether there are tabs to the left (scrollable).
   *
   * @returns `true` if the tab offset is greater than zero.
   */
  canPrevTabs(): boolean {
    return this.tabOffset() > 0;
  }

  /**
   * Checks whether there are tabs to the right (scrollable).
   *
   * @returns `true` if the tab offset is less than the maximum.
   */
  canNextTabs(): boolean {
    return this.tabOffset() < this.MAX_TAB_OFFSET;
  }

  /** Scrolls the tab window one step to the left. */
  prevTabs(): void {
    if (this.canPrevTabs()) {
      this.tabOffset.update((n) => n - 1);
      this.selectedTabLabel.set(undefined);
    }
  }

  /** Scrolls the tab window one step to the right. */
  nextTabs(): void {
    if (this.canNextTabs()) {
      this.tabOffset.update((n) => n + 1);
      this.selectedTabLabel.set(undefined);
    }
  }

  /**
   * Records the explicitly selected tab label.
   *
   * @param tabLabel - The label of the tab the user selected.
   */
  onTabChange(tabLabel: string): void {
    this.selectedTabLabel.set(tabLabel);
  }

  /**
   * Handles keyboard shortcuts for tab scrolling.
   *
   * @param event - The keyboard event.
   * @remarks
   * Ctrl+ArrowLeft scrolls tabs left, Ctrl+ArrowRight scrolls tabs right.
   */
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

  /**
   * Emits the updated card index meta override.
   *
   * @param next - The new meta override with tags and hierarchy references.
   */
  updateMeta(next: CardIndexMetaOverride): void {
    this.metaChange.emit(next);
  }
}
