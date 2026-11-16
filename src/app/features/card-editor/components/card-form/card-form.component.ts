import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import type { ContentLanguage, CardIndexMetaOverride } from '../../../../entities/card/model';
import type { CardAppearance } from '../../../../entities/card/model';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import type { CardDraft, ChoiceCardDraft } from '../../types';
import { cardFormKindGroup } from '../../utils/form/card-form.registry';
import {
  cardDraftTabIssues,
  normalizeCardDraft,
} from '../../utils/validation/card-validation.utils';
import type { CardEditorUxMode } from '../../utils/ux/card-editor-ux.utils';
import { fallbackPreviewCard } from '../../utils/preview';
import {
  resolveChoiceOptionsConfig,
  resolveChoiceOptionTexts,
  resolveChoiceOptionLexemes,
  applyChoiceOptionsState,
} from '../../utils/options';
import type { CardOptionsEditorState } from '../../utils/options/card-options-editor.utils';
import { CardPreviewComponent } from '../card-preview/card-preview.component';
import {
  CardCatalogHierarchyService,
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';
import {
  CardFormTabsComponent,
  type TabDefinition,
  type TabId,
} from '../card-form-tabs/card-form-tabs.component';
import { CardFormContentTabComponent } from '../card-form-content-tab/card-form-content-tab.component';
import { CardFormAnswersTabComponent } from '../card-form-answers-tab/card-form-answers-tab.component';
import { CardFormAppearanceTabComponent } from '../card-form-appearance-tab/card-form-appearance-tab.component';
import { CardFormPlacementTabComponent } from '../card-form-placement-tab/card-form-placement-tab.component';
import { CardFormPublishingTabComponent } from '../card-form-publishing-tab/card-form-publishing-tab.component';

/** Chooses the Russian plural form for «ошибка» based on the issue count. */
const errorWord = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'ошибка';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'ошибки';
  }
  return 'ошибок';
};

/**
 * Main form component for creating and editing cards.
 *
 * @remarks
 * Provides a tabbed interface for editing all aspects of a card draft:
 * content, answers, appearance, placement, and publishing.
 * Loads course/lesson/scenario hierarchy for card association.
 * Delegates kind-specific editing to nested form components.
 * Delegates tab navigation to `CardFormTabsComponent`.
 * Delegates tab content to the matching tab component based on stable tab id.
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
    CardFormTabsComponent,
    CardFormContentTabComponent,
    CardFormAnswersTabComponent,
    CardFormAppearanceTabComponent,
    CardFormPlacementTabComponent,
    CardFormPublishingTabComponent,
    CardPreviewComponent,
  ],
  templateUrl: './card-form.component.html',
  styleUrl: './card-form.component.scss',
})
export class CardFormComponent implements OnInit {
  private readonly hierarchyService = inject(CardCatalogHierarchyService);
  private readonly languageService = inject(LanguageService);

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

  /**
   * Editor UX mode controlling tab visibility.
   *
   * @remarks
   * Defaults to `'advanced'` so all five tabs are visible. Basic mode keeps
   * content, answers, and placement: catalog-created cards still need the
   * placement tab to be assigned to a course/lesson.
   */
  readonly uxMode = input<CardEditorUxMode>('advanced');

  /**
   * Whether the live preview pane is rendered next to the form.
   *
   * @remarks
   * Defaults to `true` so standalone usages keep the preview. The card editor
   * dialog passes `false` and lets the user reveal the preview on demand, which
   * gives the form the full dialog width.
   */
  readonly showPreview = input(true);

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

  /** Available programs for the selected course, loaded asynchronously. */
  readonly availablePrograms = signal<readonly { id: string; title: string }[]>([]);

  /** Available lessons for the selected program, loaded asynchronously. */
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

  readonly languages = () => this.languageService.getCodes();
  readonly languageLabels = () => this.languageService.getLabels();

  /** Currently selected tab id (stable, never an array index). */
  readonly activeTabId = signal<TabId>('content');

  /** Scrollable tab body, reset to the top whenever the active tab changes. */
  private readonly tabContent = viewChild<ElementRef<HTMLElement>>('tabContent');

  /**
   * Tabs available for the current card kind and UX mode.
   *
   * @remarks
   * Visibility is declared per tab id instead of relying on positional indexes.
   * The answers tab is hidden for flip cards because they have no objective answer.
   * Basic mode hides appearance and publishing; placement stays visible because
   * catalog-created cards still need to be assigned to a course/lesson.
   * Badge counts come from `cardDraftTabIssues`, which reuses the save validators.
   */
  readonly tabs = computed<TabDefinition[]>(() => {
    const kind = this.draft().kind;
    const advanced = this.uxMode() === 'advanced';
    const issues = cardDraftTabIssues(this.draft());
    return [
      this.createTab('content', 'Содержание', true, issues.content),
      this.createTab('answers', 'Ответы', kind !== 'flip', issues.answers),
      this.createTab('appearance', 'Оформление', advanced, 0),
      this.createTab('placement', 'Размещение', true, 0),
      this.createTab('publishing', 'Публикация', advanced, 0),
    ];
  });

  /**
   * Builds a tab definition with an optional validation badge.
   *
   * @param id - Stable tab identifier.
   * @param label - Display label.
   * @param visible - Whether the tab is visible.
   * @param issues - Number of blocking validation issues for the tab.
   * @returns The tab definition, including a badge and accessible label when needed.
   */
  private createTab(id: TabId, label: string, visible: boolean, issues: number): TabDefinition {
    if (!visible || issues <= 0) {
      return { id, label, visible };
    }

    return {
      id,
      label,
      visible,
      badge: String(issues),
      badgeAriaLabel: `${label}, ${issues} ${errorWord(issues)}`,
    };
  }

  constructor() {
    // Keep the active tab reachable when the draft kind changes and hides it.
    effect(() => {
      const active = this.activeTabId();
      const isVisible = this.tabs().some((tab) => tab.id === active && tab.visible);
      if (!isVisible) {
        this.activeTabId.set('content');
      }
    });
  }

  /**
   * Records the stable id of the selected tab.
   *
   * @param tabId - The stable identifier of the tab the user selected.
   */
  onTabChange(tabId: TabId): void {
    this.activeTabId.set(tabId);
    this.tabContent()?.nativeElement.scrollTo({ top: 0 });
  }

  async ngOnInit(): Promise<void> {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    const pairKey = `${known}_${learning}`;
    const courses = await this.hierarchyService.loadCourses(known, learning, pairKey);
    this.availableCourses.set(courses);

    // Если у карточки уже выбрана иерархия — загружаем программы, уроки и сценарии.
    const draft = this.draft();
    if (draft.courseId) {
      const programs = await this.hierarchyService.loadPrograms(draft.courseId);
      this.availablePrograms.set(programs.map((program) => ({ id: program.id, title: program.title })));
    }
    if (draft.programId) {
      const lessons = await this.hierarchyService.loadLessons(draft.programId);
      this.availableLessons.set(lessons);
    }
    if (draft.programId && draft.lessonId) {
      const scenarios = this.hierarchyService.getScenariosForLesson(
        draft.programId,
        draft.lessonId,
      );
      this.availableScenarios.set(scenarios);
    }
  }

  /**
   * Computed choice card draft (select, reading, timed, symbol, tone).
   *
   * @remarks
   * Returns `null` for code-select cards and for non-choice kinds such as
   * `flip`, `cloze`, and `code-trace`. This prevents unsafe casts in the
   * answers tab.
   */
  readonly choiceDraft = computed((): ChoiceCardDraft | null => {
    const draft = this.draft();
    switch (draft.kind) {
      case 'select':
      case 'reading':
      case 'timed':
      case 'symbol':
      case 'tone':
        return draft;
      default:
        return null;
    }
  });

  /**
   * Resolves the choice options editor configuration.
   * @remarks Delegates to `resolveChoiceOptionsConfig` utility.
   */
  readonly choiceOptionsConfig = computed(() => resolveChoiceOptionsConfig(this.choiceDraft()));

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
    this.updateDraft({
      ...this.draft(),
      courseId,
      programId: '',
      lessonId: '',
      scenarioId: '',
    });
    this.availablePrograms.set([]);
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (courseId) {
      const programs = await this.hierarchyService.loadPrograms(courseId);
      this.availablePrograms.set(
        programs.map((program) => ({ id: program.id, title: program.title })),
      );
    }
  }

  /**
   * Updates the selected program and loads associated lessons.
   *
   * @param programId - The selected program ID (empty string to deselect).
   * @remarks
   * Resets lessons and scenarios. Loads lessons asynchronously if a program is selected.
   */
  async updateProgramId(programId: string): Promise<void> {
    this.updateDraft({ ...this.draft(), programId, lessonId: '', scenarioId: '' });
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (programId) {
      const lessons = await this.hierarchyService.loadLessons(programId);
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
      const programId = this.draft().programId;
      if (programId) {
        const scenarios = this.hierarchyService.getScenariosForLesson(programId, lessonId);
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
}
