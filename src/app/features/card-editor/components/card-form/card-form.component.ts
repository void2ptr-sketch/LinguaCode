import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import type { ContentLanguage, CardIndexMetaOverride } from '../../../../entities/card/model';
import type { CardAppearance } from '../../../../entities/card/model';
import { CONTENT_LANGUAGE_LABELS } from '../../../../entities/card/lib/catalog-labels';
import { contentLanguages } from '../../../../entities/language-pair/lib/language-pair.utils';
import type { CardDraft, ChoiceCardDraft } from '../../types';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';
import { normalizeCardDraft } from '../../utils/validation/card-validation.utils';
import { fallbackPreviewCard } from '../../utils/preview';
import {
  resolveChoiceOptionsConfig,
  resolveChoiceOptionTexts,
  resolveChoiceOptionLexemes,
  applyChoiceOptionsState,
} from '../../utils/options';
import type { CardOptionsEditorState } from '../../utils/options/card-options-editor.utils';
import { CardFormPhoneticsPanelComponent } from '../card-form-phonetics-panel/card-form-phonetics-panel.component';
import { CardFormSettingsPanelComponent } from '../card-form-settings-panel/card-form-settings-panel.component';
import { CardPreviewComponent } from '../card-preview/card-preview.component';
import { CardOptionsEditorComponent } from '../card-options-editor/card-options-editor.component';
import { CardMetaFieldsComponent } from '../card-meta-fields/card-meta-fields.component';
import {
  CardCatalogHierarchyService,
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../../entities/card/lib/card-catalog-hierarchy/card-catalog-hierarchy.service';
import { CardFormTabsComponent, type TabDefinition } from '../card-form-tabs/card-form-tabs.component';
import { CardFormQuestionTabComponent } from '../card-form-question-tab/card-form-question-tab.component';
import { CardFormAnswersTabComponent } from '../card-form-answers-tab/card-form-answers-tab.component';

/**
 * Main form component for creating and editing cards.
 *
 * @remarks
 * Provides a tabbed interface for editing all aspects of a card draft:
 * question, answers, content, phonetics, metadata, and settings.
 * Loads course/lesson/scenario hierarchy for card association.
 * Delegates kind-specific editing to nested form components.
 * Delegates tab navigation to `CardFormTabsComponent`.
 * Delegates question tab to `CardFormQuestionTabComponent`.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTabsModule,
    CardFormTabsComponent,
    CardFormQuestionTabComponent,
    CardFormAnswersTabComponent,
    CardFormPhoneticsPanelComponent,
    CardFormSettingsPanelComponent,
    CardPreviewComponent,
    CardOptionsEditorComponent,
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
   * Falls back to a synthetic card via `fallbackPreviewCard` utility if normalization fails.
   */
  readonly previewCard = computed(() => {
    return (
      normalizeCardDraft(this.draftForPreview(), this.previewId()) ??
      fallbackPreviewCard(this.draftForPreview(), this.previewId())
    );
  });

  /** Computed font size from the effective appearance. */
  readonly previewFontSize = computed(() => this.effectiveAppearance().fontSize);

  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Currently selected tab label (explicitly chosen by user). */
  private readonly selectedTabLabel = signal<string | undefined>(undefined);

  /**
   * Label of the currently active tab.
   * @remarks
   * Uses explicitly selected tab, or falls back to the first visible tab.
   */
  readonly activeTabLabel = computed(() => {
    return this.selectedTabLabel() ?? this.allAvailableTabs[0]?.label ?? '';
  });

  /**
   * Records the explicitly selected tab label.
   *
   * @param tabLabel - The label of the tab the user selected.
   */
  onTabChange(tabLabel: string): void {
    this.selectedTabLabel.set(tabLabel);
  }

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
   * Used by the Content tab to render the options editor.
   */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    if (draft.kind === 'code-select') {
      return null;
    }
    return cardFormKindGroup(draft.kind) === 'choice' ? (draft as ChoiceCardDraft) : null;
  });

  /**
   * Resolves the choice options editor configuration.
   * @remarks Delegates to `resolveChoiceOptionsConfig` utility.
   */
  readonly choiceOptionsConfig = computed(() =>
    resolveChoiceOptionsConfig(this.choiceDraft()),
  );

  /**
   * Resolves the option texts for the choice options editor.
   * @remarks Delegates to `resolveChoiceOptionTexts` utility.
   */
  readonly choiceOptionTexts = computed(() => resolveChoiceOptionTexts(this.choiceDraft()));

  /**
   * Resolves the lexeme drafts for the choice options editor.
   * @remarks Delegates to `resolveChoiceOptionLexemes` utility.
   */
  readonly choiceOptionLexemes = computed(() => resolveChoiceOptionLexemes(this.choiceDraft()));

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
      draft.kind === 'symbol' ||
      draft.kind === 'tone'
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
    this.metaChange.emit({ ...this.meta(), knownLanguage });
  }

  /**
   * Handles learning language changes and emits the event.
   *
   * @param learningLanguage - The new learning language.
   */
  onLearningLanguageChange(learningLanguage: ContentLanguage): void {
    this.learningLanguageChange.emit(learningLanguage);
    this.metaChange.emit({ ...this.meta(), learningLanguage });
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
   * Handles state changes from the choice options editor.
   *
   * @param state - The updated options editor state.
   * @remarks
   * No-op for tone cards — syllable and toneOptions are managed separately
   * in the tone form, not through the options editor.
   */
  onChoiceOptionsStateChange(state: CardOptionsEditorState): void {
    const draft = this.choiceDraft();
    if (!draft) {
      return;
    }
    if (draft.kind === 'tone') {
      return;
    }
    this.updateDraft(applyChoiceOptionsState(draft, state));
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
}
