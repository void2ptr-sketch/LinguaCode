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

import { CourseSearchService } from '../../../../core/data';
import { activeLanguagePairCriteria } from '../../../../core/data/language-pair/language-pair-scope.utils';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../../core/data/user/user-language-pair.utils';
import { shouldShowPalladius } from '../../../../core/data/phonetic/phonetic-preferences.utils';
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

  /** Paginated course items from the catalog store. */
  readonly items = this.catalogStore.items;
  /** Total number of course items. */
  readonly totalItems = this.catalogStore.totalItems;
  /** Current page index. */
  readonly pageIndex = this.catalogStore.pageIndex;
  /** Page size for pagination. */
  readonly pageSize = this.catalogStore.pageSize;
  /** Whether the catalog is currently loading. */
  readonly loading = this.catalogStore.loading;
  /** Error message if the catalog failed to load. */
  readonly error = this.catalogStore.error;
  /** Progress percentage by course ID. */
  readonly progressByCourseId = this.catalogStore.progressByCourseId;
  /** Set of completed course IDs. */
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

  // Reload catalog on active pair change
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

  readonly languagePairInvalid = this.catalogStore.languagePairInvalid;

  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  readonly settingsEntry = computed(() => {
    const id = this.settingsPairIdDraft();
    return this.languagePairs().find((entry) => entry.id === id) ?? this.languagePairs()[0] ?? null;
  });

  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.entryLabel(entry) : '';
  });

  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  readonly showPhoneticPreferences = computed(() => {
    const learning = this.settingsEntry()?.pair.learning;
    return learning === 'en' || learning === 'zh';
  });

  readonly showTracingSettings = computed(() => this.settingsEntry()?.pair.learning === 'zh');

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

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  formatTracingDurationSec(value: number): string {
    return `${value.toFixed(1)} с`;
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.catalogStore.setSettingsPairIdDraft(id);
    this.syncPairSettingsDrafts();
  }

  removePair(id: string): void {
    const wasSettingsTarget = this.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }

    this.syncPairSettingsDrafts();
  }

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

  async onPageChange(event: PageEvent): Promise<void> {
    this.catalogStore.setPageIndex(event.pageIndex);
    this.catalogStore.setPageSize(event.pageSize);
    await this.load();
  }

  async startCourse(courseId: string): Promise<void> {
    await this.router.navigate(['/cards/select'], { queryParams: { courseId } });
  }

  isCourseCompleted(courseId: string): boolean {
    return this.completedCourseIds().has(courseId);
  }

  progressPercent(courseId: string): number {
    return this.progressByCourseId()[courseId] ?? 0;
  }

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
