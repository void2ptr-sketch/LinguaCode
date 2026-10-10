import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { CourseSearchService } from '../../../../core/repositories';
import { activeLanguagePairCriteria } from '../../../../core/repositories/language-pair/language-pair-scope.utils';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../../core/repositories/user/user-language-pair.utils';
import { shouldShowPalladius } from '../../../../core/repositories/phonetic/phonetic-preferences.utils';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import type {
  CjkLearningPreferences,
  CourseIndexEntry,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
} from '../../../../core/models';
import {
  ROMANIZATION_DISPLAY_ORDER,  
} from '../../../../core/models/phonetic-content.types';
import type { PageEvent } from '@angular/material/paginator';
import type { RomanizationOption } from '../../../../shared/ui/course-display-settings-matrix';
import { CourseCatalogStore } from '../../services/course-catalog.store';
import { CourseCatalogCoursesComponent } from '../course-card-list/course-card-list.component';
import { CourseCatalogSettingsComponent } from '../course-settings/course-settings.component';
import { CourseCatalogProgramsComponent } from '../program-list/program-list.component';

let lastKnownCourseCatalogActiveLanguagePairId: string | null = null;

/**
 * Course catalog page component. Main entry point for browsing courses, managing user profiles,
 * and configuring language pair settings.
 * @remarks Composed of three sub-tabs: Courses, Programs, and Settings.
 */
@Component({
  selector: 'app-course-catalog-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    CourseCatalogCoursesComponent,
    CourseCatalogSettingsComponent,
    CourseCatalogProgramsComponent,
  ],
  standalone: true,
  templateUrl: './course-catalog-page.component.html',
  styleUrl: './course-catalog-page.component.scss',
})
export class CourseCatalogPageComponent implements OnInit {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);
  readonly catalogStore = inject(CourseCatalogStore);

  /** Direct references to sub-tab components. */
  readonly coursesComponent = CourseCatalogCoursesComponent;
  readonly settingsComponent = CourseCatalogSettingsComponent;
  readonly programsComponent = CourseCatalogProgramsComponent;

  /**
   * Paginated course items from the catalog store.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.items`.
   */
  readonly items = this.catalogStore.items;
  /**
   * Total number of course items.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.totalItems`.
   */
  readonly totalItems = this.catalogStore.totalItems;
  /**
   * Current page index.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.pageIndex`.
   */
  readonly pageIndex = this.catalogStore.pageIndex;
  /**
   * Page size for pagination.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.pageSize`.
   */
  readonly pageSize = this.catalogStore.pageSize;
  /**
   * Whether the catalog is currently loading.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.loading`.
   */
  readonly loading = this.catalogStore.loading;
  /**
   * Error message if the catalog failed to load.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.error`.
   */
  readonly error = this.catalogStore.error;
  /**
   * Progress percentage by course ID.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.progressByCourseId`.
   */
  readonly progressByCourseId = this.catalogStore.progressByCourseId;
  /**
   * Set of completed course IDs.
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.completedCourseIds`.
   */
  readonly completedCourseIds = this.catalogStore.completedCourseIds;

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;
  /** User preferences signal from the store. */
  readonly preferences = this.userStore.preferences;
  /** Available language pairs from the store. */
  readonly languagePairs = this.userStore.languagePairs;
  /** Active language pair ID from the store. */
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  /** Draft value for the user's display name. */
  readonly nameDraft = this.catalogStore.nameDraft;
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = this.catalogStore.learningProficiencyDraft;
  /** Draft value for the application theme. */
  readonly themeDraft = this.catalogStore.themeDraft;
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = this.catalogStore.fontSizeDraft;
  /** Draft value for the color scheme. */
  readonly colorSchemeDraft = this.catalogStore.colorSchemeDraft;
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = this.catalogStore.cardFocusFullscreenDraft;

  /** Draft value for the known (source) language. */
  readonly knownLanguageDraft = this.catalogStore.knownLanguageDraft;
  /** Draft value for the learning (target) language. */
  readonly learningLanguageDraft = this.catalogStore.learningLanguageDraft;

  /** Draft ID for the settings language pair. */
  readonly settingsPairIdDraft = this.catalogStore.settingsPairIdDraft;
  /** Draft display romanization systems. */
  readonly displayRomanizationsDraft = this.catalogStore.displayRomanizationsDraft;
  /** Draft answer romanization systems. */
  readonly answerRomanizationsDraft = this.catalogStore.answerRomanizationsDraft;
  /** Draft IPA display preference. */
  readonly showIpaDraft = this.catalogStore.showIpaDraft;
  /** Draft custom IPA variant label. */
  readonly ipaVariantLabelDraft = this.catalogStore.ipaVariantLabelDraft;
  /** Draft answer display modes. */
  readonly answerModesDraft = this.catalogStore.answerModesDraft;
  /** Draft tone color enabled preference. */
  readonly toneColorEnabledDraft = this.catalogStore.toneColorEnabledDraft;
  /** Draft tone color scheme preference. */
  readonly toneColorSchemeDraft = this.catalogStore.toneColorSchemeDraft;
  /** Draft tracing stroke duration preference. */
  readonly tracingStrokeDurationDraft = this.catalogStore.tracingStrokeDurationDraft;

  /** Currently selected tab index. */
  readonly selectedTabIndex = this.catalogStore.selectedTabIndex;

  /**
   * Reloads the course catalog when the active language pair changes.
   *
   * @remarks
   * Skips the first trigger (when `lastKnownCourseCatalogActiveLanguagePairId` is `null`)
   * to avoid an unnecessary reload on initial component creation. Uses a module-level
   * variable to track the previous active pair ID.
   */
  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownCourseCatalogActiveLanguagePairId !== null &&
      lastKnownCourseCatalogActiveLanguagePairId !== activeId
    ) {
      void this.load();
    }

    lastKnownCourseCatalogActiveLanguagePairId = activeId;
  });

  async ngOnInit(): Promise<void> {
    this.catalogStore.setLearningProficiencyDraft(this.preferences().learningProficiencyLevel);
    this.syncPairSettingsDrafts();
    await this.load();
  }

  // ---- Computed ----

  /**
   * Whether the known and learning language drafts are identical (invalid).
   *
   * @remarks
   * Tied directly to `CourseCatalogStore.languagePairInvalid`. Used to disable
   * the "Add Pair" button when both languages are the same.
   */
  readonly languagePairInvalid = this.catalogStore.languagePairInvalid;

  /**
   * Whether there is more than one language pair (enables removal).
   *
   * @remarks
   * When `true`, the "Remove" button is shown for each language pair entry.
   */
  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  /**
   * The settings language pair entry.
   *
   * @remarks
   * Resolves the entry matching `settingsPairIdDraft`, falling back to the first
   * available pair or `null` if none exist.
   */
  readonly settingsEntry = computed(() => {
    const id = this.settingsPairIdDraft();
    return this.languagePairs().find((entry) => entry.id === id) ?? this.languagePairs()[0] ?? null;
  });

  /**
   * Label for the settings course entry (known → learning).
   *
   * @remarks
   * Derived from `settingsEntry` via `entryLabel`. Returns an empty string when
   * no settings entry is available.
   */
  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.entryLabel(entry) : '';
  });

  /**
   * Whether CJK-specific preferences (romanization, tone coloring) should be shown.
   *
   * @remarks
   * Returns `true` when the known language supports Palladius romanization
   * (e.g., Russian) and the learning language is CJK (e.g., Chinese).
   */
  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  /**
   * Whether phonetic preferences (IPA, answer modes) should be shown.
   *
   * @remarks
   * Returns `true` when the learning language is English ('en') or Chinese ('zh').
   */
  readonly showPhoneticPreferences = computed(() => {
    const learning = this.settingsEntry()?.pair.learning;
    return learning === 'en' || learning === 'zh';
  });

  /**
   * Whether tracing stroke duration settings should be shown.
   *
   * @remarks
   * Returns `true` only when the learning language is Chinese ('zh').
   */
  readonly showTracingSettings = computed(() => this.settingsEntry()?.pair.learning === 'zh');

  /**
   * Available romanization options for display and answer settings.
   *
   * @remarks
   * Always includes Pinyin and Zhuyin. Palladius is added when `showCjkPreferences` is `true`.
   * Options are ordered by `ROMANIZATION_DISPLAY_ORDER`.
   */
  readonly romanizationOptions = computed((): readonly RomanizationOption[] => {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];

    if (this.showCjkPreferences()) {
      options.push({ value: 'palladius', label: 'Палладица' });
    }

    return ROMANIZATION_DISPLAY_ORDER.flatMap((system) => {
      const option = options.find((item) => item.value === system);
      return option ? [option] : [];
    });
  });

  // ---- Methods ----

  /**
   * Formats a language pair entry as a human-readable label.
   *
   * @param entry - The language pair entry to format.
   * @returns A formatted label string from `UserStore.formatEntryLabel`.
   */
  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  /**
   * Formats a tracing duration value in seconds with one decimal place.
   *
   * @param value - The duration in seconds.
   * @returns A formatted string with one decimal place and a Cyrillic 'с' suffix.
   */
  formatTracingDurationSec(value: number): string {
    return `${value.toFixed(1)} с`;
  }

  /**
   * Checks whether the given entry is the active language pair.
   *
   * @param entry - The language pair entry to check.
   * @returns `true` if the entry is the active one.
   */
  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  /**
   * Sets the active language pair and syncs settings drafts.
   *
   * @param id - The ID of the language pair to activate.
   *
   * @remarks
   * Updates both the user store and catalog store, then syncs the pair-specific
   * settings (romanizations, IPA, tone colors) into the draft signals.
   */
  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.catalogStore.setSettingsPairIdDraft(id);
    this.syncPairSettingsDrafts();
  }

  /**
   * Removes a language pair and syncs settings drafts.
   *
   * @param id - The ID of the language pair to remove.
   *
   * @remarks
   * If the removed pair was the settings target, the settings draft is updated
   * to the current active pair. Then all pair settings drafts are re-synced.
   */
  removePair(id: string): void {
    const wasSettingsTarget = this.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }

    this.syncPairSettingsDrafts();
  }

  /**
   * Adds a new language pair from the draft values and syncs settings.
   *
   * @remarks
   * Only adds the pair if the known and learning languages are different
   * (checked via `languagePairInvalid`). Sets the settings pair ID draft
   * to the newly added pair's ID and syncs its settings.
   */
  addPair(): void {
    if (this.languagePairInvalid()) {
      return;
    }

    this.userStore.addLanguagePair({
      known: this.knownLanguageDraft(),
      learning: this.learningLanguageDraft(),
    });
    this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    this.syncPairSettingsDrafts();
  }

  /**
   * Saves the user profile and language pair settings.
   *
   * @remarks
   * Persists the display name, user preferences, and (if applicable) CJK learning
   * preferences and phonetic settings for the current settings entry.
   */
  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });

    const entry = this.settingsEntry();
    if (!entry) {
      return;
    }

    const patch: Partial<UserLanguagePairSettings> = {};

    if (this.showCjkPreferences() || this.showTracingSettings()) {
      const cjkPatch: Partial<CjkLearningPreferences> = {};

      if (this.showCjkPreferences()) {
        cjkPatch.displayRomanizations = [...this.displayRomanizationsDraft()];
        cjkPatch.answerRomanization = [...this.answerRomanizationsDraft()];
        cjkPatch.showTones = this.toneColorEnabledDraft();
        cjkPatch.toneColorScheme = this.toneColorSchemeDraft();
      }

      if (this.showTracingSettings()) {
        cjkPatch.tracingStrokeDurationSec = this.tracingStrokeDurationDraft();
      }

      patch.cjkLearning = cjkPatch as CjkLearningPreferences;
    }

    if (this.showPhoneticPreferences()) {
      const phonetic = resolvePhoneticForPair(entry);
      patch.phonetic = {
        showIpa: this.showIpaDraft(),
        ipaVariantLabel: this.ipaVariantLabelDraft().trim() || undefined,
        answerModes: [...this.answerModesDraft()],
        displayOrthography: phonetic.displayOrthography,
      };
    }

    if (patch.cjkLearning || patch.phonetic) {
      this.userStore.updateLanguagePairSettings(entry.id, patch);
      this.syncPairSettingsDrafts();
    }
  }

  /**
   * Syncs pair-specific settings from the user store into catalog store drafts.
   *
   * @remarks
   * Reads CJK learning preferences and phonetic settings from the current `settingsEntry`
   * and populates the corresponding draft signals in `CourseCatalogStore`. Called
   * whenever the active language pair changes or a pair is added/removed.
   */
  private syncPairSettingsDrafts(): void {
    const entry = this.settingsEntry();
    const cjk = resolveCjkLearningForPair(entry);
    const phonetic = resolvePhoneticForPair(entry);

    this.catalogStore.setDisplayRomanizationsDraft([...cjk.displayRomanizations]);
    this.catalogStore.setAnswerRomanizationsDraft([...cjk.answerRomanization]);
    this.catalogStore.setToneColorEnabledDraft(cjk.showTones);
    this.catalogStore.setToneColorSchemeDraft(cjk.toneColorScheme);
    this.catalogStore.setTracingStrokeDurationDraft(cjk.tracingStrokeDurationSec);
    this.catalogStore.setShowIpaDraft(phonetic.showIpa);
    this.catalogStore.setIpaVariantLabelDraft(phonetic.ipaVariantLabel ?? '');
    this.catalogStore.setAnswerModesDraft([...phonetic.answerModes]);
  }

  // ---- Course catalog methods ----

  /**
   * Loads the course catalog from the search service.
   *
   * @remarks
   * Sets loading state, fetches published courses matching the active language pair criteria,
   * and loads progress data for each course. On error, sets an error message.
   */
  async load(): Promise<void> {
    this.catalogStore.setLoading(true);
    this.catalogStore.setError(null);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        scope: 'published',
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.catalogStore.setItems(page.items);
      this.catalogStore.setTotalItems(page.totalItems);
      await this.loadProgress(page.items);
    } catch {
      this.catalogStore.setError('Не удалось загрузить каталог курсов');
    } finally {
      this.catalogStore.setLoading(false);
    }
  }

  /**
   * Handles paginator page changes.
   *
   * @param event - The page event from Angular Material paginator.
   *
   * @remarks
   * Updates the catalog store's page index and page size, then reloads the catalog.
   */
  async onPageChange(event: PageEvent): Promise<void> {
    this.catalogStore.setPageIndex(event.pageIndex);
    this.catalogStore.setPageSize(event.pageSize);
    await this.load();
  }

  /**
   * Navigates to the card select page for the given course.
   *
   * @param courseId - The ID of the course to start.
   *
   * @remarks
   * Uses the Angular router to navigate to `/cards/select` with the course ID
   * passed as a query parameter.
   */
  async startCourse(courseId: string): Promise<void> {
    await this.router.navigate(['/cards/select'], { queryParams: { courseId } });
  }

  /**
   * Checks whether a course has been fully completed.
   *
   * @param courseId - The ID of the course to check.
   * @returns `true` if the course ID is in the completed set.
   */
  isCourseCompleted(courseId: string): boolean {
    return this.completedCourseIds().has(courseId);
  }

  /**
   * Returns the progress percentage for a given course.
   *
   * @param courseId - The ID of the course.
   * @returns The completion percentage (0-100), or `0` if no progress data exists.
   */
  progressPercent(courseId: string): number {
    return this.progressByCourseId()[courseId] ?? 0;
  }

  /**
   * Loads progress data for the given course items.
   *
   * @param items - The course index entries to load progress for.
   *
   * @remarks
   * Fetches each course by ID, computes progress stats via `LearningResultsStore.courseProgress`,
   * and checks completion via `LearningResultsStore.isCourseCompleted`. Sets the results
   * in the catalog store via `setProgressByCourseId` and `setCompletedCourseIds`.
   */
  private async loadProgress(items: readonly CourseIndexEntry[]): Promise<void> {
    const progress: Record<string, number> = {};
    const completed = new Set<string>();

    await Promise.all(
      items.map(async (entry) => {
        try {
          const course = await this.courseSearchService.getById(entry.id);
          const stats = this.resultsStore.courseProgress(
            entry.id,
            course.lessons.map((lesson) => ({
              lessonId: lesson.id,
              scenarioIds: lesson.scenarioIds,
            })),
          );
          progress[entry.id] = stats.percent;

          if (this.resultsStore.isCourseCompleted(course.lessons)) {
            completed.add(entry.id);
          }
        } catch {
          progress[entry.id] = 0;
        }
      }),
    );

    this.catalogStore.setProgressByCourseId(progress);
    this.catalogStore.setCompletedCourseIds(completed);
  }
}
