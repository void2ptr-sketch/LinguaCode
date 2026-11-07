import { Component, ChangeDetectionStrategy, computed, output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CourseCatalogStore } from '../../services/course-catalog.store';
import { UiPaginationComponent } from '../../../../shared/utils/pagination';

/**
 * Course catalog course list component. Displays all courses matching the active
 * language pair, with progress indicators and a "Start" button.
 * @remarks Delegates state to `CourseCatalogStore`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-catalog-course-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  standalone: true,
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss',
})
export class CourseCatalogCourseListComponent {
  /**
   * Emits the course ID when the user clicks "Start".
   *
   * @remarks
   * The parent component should listen for this output to initiate
   * navigation to the journey map (learning path) for the given course.
   */
  readonly startCourse = output<string>();

  readonly catalogStore = inject(CourseCatalogStore);

  /** Whether the catalog is currently loading. */
  readonly loading = this.catalogStore.loading;
  /** Error message if the catalog failed to load. */
  readonly error = this.catalogStore.error;
  /** Course items from the catalog store. */
  readonly items = this.catalogStore.items;
  /** Progress percentage by course ID. */
  readonly progressByCourseId = this.catalogStore.progressByCourseId;
  /** Set of completed course IDs. */
  readonly completedCourseIds = this.catalogStore.completedCourseIds;
  /** Total number of courses. */
  readonly totalItems = this.catalogStore.totalItems;
  /** Current page index. */
  readonly pageIndex = this.catalogStore.pageIndex;
  /** Page size. */
  readonly pageSize = this.catalogStore.pageSize;

  // ---- Computed signals for template ----

  /** Total items value for template. */
  readonly totalItemsValue = computed(() => this.catalogStore.totalItems());
  /** Page index value for template. */
  readonly pageIndexValue = computed(() => this.catalogStore.pageIndex());
  /** Page size value for template. */
  readonly pageSizeValue = computed(() => this.catalogStore.pageSize());

  // ---- Methods ----

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
   * Handles page change events from the paginator.
   *
   * @param event - The page event from Angular Material paginator.
   */
  onPageChange(event: import('@angular/material/paginator').PageEvent): void {
    this.catalogStore.onPageChange(event);
  }
}
