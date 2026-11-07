import { Component, ChangeDetectionStrategy, computed, output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CourseCatalogStore } from '../../services/course-catalog.store';
import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import { ScormExportService } from '../../../../entities/course/api';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { ErrorToastService } from '../../../../shared/ui/error-toast/error-toast.service';

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
  private readonly scormExportService = inject(ScormExportService);
  private readonly logger = inject(AppLoggerService);
  private readonly errorToast = inject(ErrorToastService);

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

  // ---- SCORM Export ----

  /** Track which courses are currently exporting. */
  private readonly exportingIds = new Set<string>();

  /**
   * Checks if a course is currently being exported.
   *
   * @param courseId - The course ID.
   * @returns `true` if the course is currently exporting.
   */
  isExporting(courseId: string): boolean {
    return this.exportingIds.has(courseId);
  }

  /**
   * Exports a course to SCORM format and downloads the bundle as JSON.
   *
   * @param courseId - The course ID to export.
   */
  async exportToScorm(courseId: string): Promise<void> {
    if (this.exportingIds.has(courseId)) {
      return;
    }

    this.exportingIds.add(courseId);

    try {
      const bundle = await this.scormExportService.export(courseId);
      const courseTitle = this.items().find((c) => c.id === courseId)?.title ?? courseId;
      const filename = `${courseTitle}-scorm-export.json`;

      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      this.logger.error('SCORM export failed for course', { courseId, error });
      this.errorToast.show('Не удалось экспортировать курс в SCORM');
    } finally {
      this.exportingIds.delete(courseId);
    }
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
   * Handles page change events from the paginator.
   *
   * @param event - The page event from Angular Material paginator.
   */
  onPageChange(event: import('@angular/material/paginator').PageEvent): void {
    this.catalogStore.onPageChange(event);
  }
}
