import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

import { CourseSearchService } from '../../../../core/data';
import { activeLanguagePairCriteria } from '../../../../core/data/language-pair/language-pair-scope.utils';
import type {
  AppColorScheme,
  CjkLearningPreferences,
  ContentLanguage,
  CourseIndexEntry,
  LearningProficiencyLevel,
  RomanizationSystem,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../../../../core/models';
import type { ToneColorSchemeId } from '../../../../core/models/tone-color.types';
import {
  ROMANIZATION_DISPLAY_ORDER,
  TRACING_STROKE_DURATION_BOUNDS,
} from '../../../../core/models/phonetic-content.types';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../../core/data/user/user-language-pair.utils';
import { shouldShowPalladius } from '../../../../core/data/phonetic/phonetic-preferences.utils';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import type { PageEvent } from '@angular/material/paginator';
import {
  CourseCatalogCoursesComponent,
} from '../course-card-list/course-card-list.component';
import {
  CourseCatalogSettingsComponent,
} from '../course-settings/course-settings.component';
import {
  CourseCatalogProgramsComponent,
} from '../program-list/program-list.component';
import type { RomanizationOption } from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.component';
import { type AnswerDisplayMode } from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.utils';

let lastKnownCourseCatalogActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-course-catalog-page',
  imports: [
    FormsModule,
    MatButtonModule,
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

  // Course catalog state
  readonly items = signal<readonly CourseIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly progressByCourseId = signal<Readonly<Record<string, number>>>({});
  readonly completedCourseIds = signal<ReadonlySet<string>>(new Set());

  // User profile state
  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languagePairs = this.userStore.languagePairs;
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  // Draft signals for profile
  readonly nameDraft = signal(this.displayName());
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.preferences().learningProficiencyLevel,
  );
  readonly themeDraft = signal<AppColorScheme>(this.preferences().theme as AppColorScheme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly colorSchemeDraft = signal<AppColorScheme>(this.preferences().colorScheme as AppColorScheme);
  readonly cardFocusFullscreenDraft = signal(this.preferences().cardFocusFullscreen);

  // Course tab signals
  readonly knownLanguageDraft = signal<ContentLanguage>('ru');
  readonly learningLanguageDraft = signal<ContentLanguage>('en');

  // Course settings tab signals
  readonly settingsPairIdDraft = signal(this.activeLanguagePairId());
  readonly displayRomanizationsDraft = signal<readonly RomanizationSystem[]>(['pinyin']);
  readonly answerRomanizationsDraft = signal<readonly RomanizationSystem[]>([
    'pinyin',
    'palladius',
  ]);
  readonly showIpaDraft = signal(false);
  readonly ipaVariantLabelDraft = signal('');
  readonly answerModesDraft = signal<readonly AnswerDisplayMode[]>(['orthography']);
  readonly toneColorEnabledDraft = signal(false);
  readonly toneColorSchemeDraft = signal<ToneColorSchemeId>('classic');
  readonly tracingStrokeDurationDraft = signal<number>(TRACING_STROKE_DURATION_BOUNDS.defaultSec);

  // Tab control
  readonly selectedTabIndex = signal(0);

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
    this.learningProficiencyDraft.set(this.preferences().learningProficiencyLevel);
    this.syncPairSettingsDrafts();
    await this.load();
  }

  // ---- Computed ----

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

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
    this.settingsPairIdDraft.set(id);
    this.syncPairSettingsDrafts();
  }

  removePair(id: string): void {
    const wasSettingsTarget = this.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.settingsPairIdDraft.set(this.activeLanguagePairId());
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
    this.settingsPairIdDraft.set(this.activeLanguagePairId());
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

    this.displayRomanizationsDraft.set([...cjk.displayRomanizations]);
    this.answerRomanizationsDraft.set([...cjk.answerRomanization]);
    this.toneColorEnabledDraft.set(cjk.showTones);
    this.toneColorSchemeDraft.set(cjk.toneColorScheme);
    this.tracingStrokeDurationDraft.set(cjk.tracingStrokeDurationSec);
    this.showIpaDraft.set(phonetic.showIpa);
    this.ipaVariantLabelDraft.set(phonetic.ipaVariantLabel ?? '');
    this.answerModesDraft.set([...phonetic.answerModes]);
  }

  // ---- Course catalog methods ----

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        scope: 'published',
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.items.set(page.items);
      this.totalItems.set(page.totalItems);
      await this.loadProgress(page.items);
    } catch {
      this.error.set('Не удалось загрузить каталог курсов');
    } finally {
      this.loading.set(false);
    }
  }

  async onPageChange(event: PageEvent): Promise<void> {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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

    this.progressByCourseId.set(progress);
    this.completedCourseIds.set(completed);
  }
}
