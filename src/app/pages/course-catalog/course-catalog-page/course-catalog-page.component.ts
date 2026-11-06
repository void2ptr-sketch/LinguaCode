import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { CourseSearchService } from '../../../entities/course';
import { activeLanguagePairCriteria } from '../../../entities/language-pair/lib/language-pair-scope.utils';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import type { CourseIndexEntry } from '../../../entities/course/model';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogStore, DraftsStore } from '../../../features/course-catalog/services';
import { CourseCatalogCoursesComponent } from '../../../features/course-catalog/components/course-card-list/course-card-list.component';
import { CourseCatalogProgramsComponent } from '../../../features/course-catalog/components/program-list/program-list.component';
import { CourseCatalogLanguagePairManagerService } from '../../../features/course-catalog/services/course-catalog-language-pair-manager.service';

/**
 * Course catalog page component. Main entry point for browsing courses, managing user profiles,
 * and configuring language pair settings.
 * @remarks Composed of three sub-tabs: Courses, Programs, and Settings.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-catalog-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    CourseCatalogCoursesComponent,
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
  private readonly logger = inject(AppLoggerService);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);
  readonly catalogStore = inject(CourseCatalogStore);
  readonly drafts = inject(DraftsStore);

  /** Direct references to sub-tab components. */
  readonly coursesComponent = CourseCatalogCoursesComponent;
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
  readonly nameDraft = this.drafts.profileNameDraft;
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = this.drafts.profileLearningProficiencyDraft;
  /** Draft value for the application theme. */
  readonly themeDraft = this.drafts.profileThemeDraft;
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = this.drafts.profileFontSizeDraft;
  /** Draft value for the color scheme. */
  readonly colorSchemeDraft = this.drafts.profileColorSchemeDraft;
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = this.drafts.profileCardFocusFullscreenDraft;

  /** Currently selected tab index. */
  readonly selectedTabIndex = this.catalogStore.selectedTabIndex;

  /**
   * Reloads the course catalog when the active language pair changes.
   *
   * @remarks
   * Delegates to `CourseCatalogLanguagePairManagerService.trackActivePairChange`.
   */
  private readonly reloadOnActivePairChange = this.pairManager.trackActivePairChange(async () => {
    this.catalogStore.setSelectedCourseId('');
    await this.load();
  });

  /**
   * Syncs `selectedCourseId` from `learningSession` when on the Programs tab.
   *
   * @remarks
   * When the user switches to tab 1 ("Программы курса"), the store's
   * `selectedCourseId` is set to `learningSession().activeCourseId` and the
   * catalog is reloaded so that client-side filtering is applied.
   * Auto-sync is suppressed when `filterDismissedUntilTabChange` is true.
   */
  private readonly syncSelectedCourseIdEffect = effect(() => {
    const tabIndex = this.selectedTabIndex();
    const dismissed = this.catalogStore.filterDismissedUntilTabChange();
    const activeCourseId = this.userStore.learningSession().activeCourseId;
    const currentSelectedId = this.catalogStore.selectedCourseId();

    if (tabIndex === 1 && activeCourseId && !dismissed && currentSelectedId !== activeCourseId) {
      this.catalogStore.setSelectedCourseId(activeCourseId);
      // reload applies client-side filter by selectedCourseId
      void this.load();
    }
  });

  async ngOnInit(): Promise<void> {
    this.drafts.setProfileLearningProficiencyDraft(
      this.userStore.preferences().learningProficiencyLevel,
    );
    this.pairManager.syncPairSettingsDrafts();
    await this.load();
  }

  // ---- Computed ----

  // ---- Methods ----

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
    this.pairManager.setActive(id);
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
    this.pairManager.removePair(id);
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
    if (this.drafts.courseTabLanguagePairInvalid()) {
      return;
    }

    this.pairManager.addPair();
  }

  /**
   * Saves the user profile.
   *
   * @remarks
   * Persists the display name and user preferences.
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
      const selectedCourseId = this.catalogStore.selectedCourseId();

      // When filtering by course, fetch all items (no pagination) to ensure
      // the target course is included regardless of its position.
      const pageSize = selectedCourseId ? 1000 : this.pageSize();

      const page = await this.courseSearchService.search({
        scope: 'published',
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize },
      });

      const allItems = page.items ?? [];

      const filteredItems = selectedCourseId
        ? allItems.filter((item) => item.id === selectedCourseId)
        : allItems;

      this.catalogStore.setItems(filteredItems);
      this.catalogStore.setTotalItems(filteredItems.length);
      await this.loadProgress(filteredItems);
    } catch (error) {
      this.logger.error('CourseCatalog: failed to load catalog', error);
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
   * Navigates to the journey map (learning path) for the given course.
   *
   * @param courseId - The ID of the course to start.
   *
   * @remarks
   * Uses the Angular router to navigate to `/journey` with the course ID
   * passed as a query parameter. The journey page renders the "Путь обучения"
   * map for the selected course.
   */
  async startCourse(courseId: string): Promise<void> {
    await this.router.navigate(['/journey'], { queryParams: { courseId } });
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
          const allLessons: { lessonId: string; scenarioIds: readonly string[] }[] = [];
          for (const program of course.programs) {
            for (const lesson of program.lessons ?? []) {
              allLessons.push({
                lessonId: lesson.id,
                scenarioIds: lesson.scenarioIds,
              });
            }
          }
          const stats = this.resultsStore.courseProgress(entry.id, allLessons);
          progress[entry.id] = stats.percent;

          if (this.resultsStore.isCourseCompleted(allLessons)) {
            completed.add(entry.id);
          }
        } catch (error) {
          this.logger.debug('CourseCatalog: progress fallback for course', error);
          progress[entry.id] = 0;
        }
      }),
    );

    this.catalogStore.setProgressByCourseId(progress);
    this.catalogStore.setCompletedCourseIds(completed);
  }
}
