import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CourseSearchService } from '../../../entities/course';
import {
  activeLanguagePairCriteria,
} from '../../../entities/language-pair/lib/language-pair-scope.utils';
import { LanguagePairsApiService } from '../../../entities/language-pair/api';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import type { CourseIndexEntry } from '../../../entities/course/model';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogStore } from '../../../features/course-catalog/services';
import { CourseCatalogCourseListComponent } from '../../../features/course-catalog/components/course-list';
import { CourseCatalogProgramsComponent } from '../../../features/course-catalog/components/program-list/program-list.component';
import { CourseCatalogLanguagePairManagerService } from '../../../features/course-catalog/services/course-catalog-language-pair-manager.service';

/**
 * Course catalog page component. Main entry point for browsing courses and
 * configuring language pair settings.
 * @remarks Composed of three sub-tabs: Courses, Programs, and Settings.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-catalog-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    CourseCatalogCourseListComponent,
    CourseCatalogProgramsComponent,
  ],
  standalone: true,
  templateUrl: './course-catalog-page.component.html',
  styleUrl: './course-catalog-page.component.scss',
})
export class CourseCatalogPageComponent implements OnInit {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);
  private readonly logger = inject(AppLoggerService);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);
  readonly catalogStore = inject(CourseCatalogStore);

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
   * Syncs `selectedCourseId` when on the Programs tab.
   *
   * @remarks
   * When the user switches to tab 1 ("Программы курса"), the store's
   * `selectedCourseId` is set to the activated course (via checkbox).
   * If no course is activated, it defaults to the first course from items.
   * Auto-sync is suppressed when `filterDismissedUntilTabChange` is true.
   */
  private readonly syncSelectedCourseIdEffect = effect(() => {
    const tabIndex = this.selectedTabIndex();
    const dismissed = this.catalogStore.filterDismissedUntilTabChange();
    const currentSelectedId = this.catalogStore.selectedCourseId();
    const items = this.items();

    if (tabIndex === 1 && !dismissed && currentSelectedId.length === 0 && items.length > 0) {
      // No course activated — pick the first one automatically
      this.catalogStore.setSelectedCourseId(items[0].id);
    }
  });

  async ngOnInit(): Promise<void> {
    await this.load();
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

      // Build language pair IDs from ALL user language pairs (not just active)
      // Map local pairs → backend pair IDs via /language-pairs API
      const allPairs = this.userStore.languagePairs();
      const backendPairs = await this.languagePairsApi.listAll();
      const pairIdMap = new Map<string, number>();
      for (const bp of backendPairs) {
        pairIdMap.set(`${bp.knownCode}→${bp.learningCode}`, bp.id);
      }

      const languagePairIds = allPairs
        .map((entry) => pairIdMap.get(`${entry.pair.known}→${entry.pair.learning}`))
        .filter((id): id is number => id != null);

      const page = await this.courseSearchService.search({
        scope: 'published',
        ...activeLanguagePairCriteria(pair),
        languagePairIds: languagePairIds.length > 0 ? languagePairIds : undefined,
        page: { page: this.pageIndex(), pageSize },
      });

      const allItems = page.items ?? [];

      // Client-side filter by selectedCourseId only (backend already filters by languagePairIds)
      const filteredByPair = selectedCourseId
        ? allItems.filter((item) => item.id === selectedCourseId)
        : allItems;

      this.catalogStore.setItems(filteredByPair);
      this.catalogStore.setTotalItems(filteredByPair.length);
      await this.loadProgress(filteredByPair);
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
   * Navigates to the journey map (learning path) for the given course or program.
   *
   * @param id - The course or program ID to start.
   *
   * @remarks
   * Uses the Angular router to navigate to `/journey` with the ID
   * passed as a query parameter.
   */
  async startCourse(id: string): Promise<void> {
    await this.router.navigate(['/journey'], { queryParams: { courseId: id } });
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
