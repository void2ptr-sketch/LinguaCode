import { Component, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogStore } from '../../services/course-catalog.store';

/**
 * Course programs list component. Displays paginated course cards with progress indicators
 * and a "Start" button to launch practice sessions.
 * @remarks Delegates state to `CourseCatalogStore`.
 */
@Component({
  selector: 'app-course-catalog-programs',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    UiPaginationComponent,
  ],
  standalone: true,
  templateUrl: './program-list.component.html',
  styleUrl: './program-list.component.scss',
})
export class CourseCatalogProgramsComponent {
  /**
   * Emits when the user requests to reload the course list.
   *
   * @remarks
   * Currently unused; reserved for future refresh functionality.
   */
  readonly loadRequested = output<void>();
  /**
   * Emits the course ID when the user clicks "Start".
   *
   * @remarks
   * The parent component should listen for this output to initiate
   * navigation to the card select page for the given course.
   */
  readonly startCourse = output<string>();

  readonly catalogStore = inject(CourseCatalogStore);

  /** Whether the catalog is currently loading. */
  readonly loading = this.catalogStore.loading;
  /** Error message if the catalog failed to load. */
  readonly error = this.catalogStore.error;
  /** Paginated course items from the catalog store. */
  readonly items = this.catalogStore.items;
  /** Total number of course items. */
  readonly totalItems = this.catalogStore.totalItems;
  /** Current page index. */
  readonly pageIndex = this.catalogStore.pageIndex;
  /** Page size for pagination. */
  readonly pageSize = this.catalogStore.pageSize;
  /** Progress percentage by course ID. */
  readonly progressByCourseId = this.catalogStore.progressByCourseId;
  /** Set of completed course IDs. */
  readonly completedCourseIds = this.catalogStore.completedCourseIds;

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
   * Handles paginator page changes.
   *
   * @param event - The page event from Angular Material paginator.
   *
   * @remarks
   * Updates the catalog store's page index and page size. Does not trigger a reload;
   * the parent component must call `load()` separately.
   */
  onPageChange(event: PageEvent): void {
    this.catalogStore.setPageIndex(event.pageIndex);
    this.catalogStore.setPageSize(event.pageSize);
  }
}
