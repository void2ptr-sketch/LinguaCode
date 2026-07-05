import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { CourseSearchService } from '../../../../core/data';
import { activeLanguagePairCriteria } from '../../../../core/data/language-pair/language-pair-scope.utils';
import type { CourseIndexEntry } from '../../../../core/models';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { UiPaginationComponent } from '../../../../shared/pagination';

let lastKnownCourseCatalogActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-course-catalog-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  templateUrl: './course-catalog-page.component.html',
  styleUrl: './course-catalog-page.component.scss',
})
export class CourseCatalogPageComponent implements OnInit {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);

  readonly items = signal<readonly CourseIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly progressByCourseId = signal<Readonly<Record<string, number>>>({});
  readonly completedCourseIds = signal<ReadonlySet<string>>(new Set());

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
    await this.load();
  }

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
