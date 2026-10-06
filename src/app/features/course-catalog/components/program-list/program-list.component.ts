import { Component, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { CourseIndexEntry } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogStore } from '../../services/course-catalog.store';

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
  // Outputs for actions that involve parent business logic
  readonly loadRequested = output<void>();
  readonly startCourse = output<string>();

  readonly catalogStore = inject(CourseCatalogStore);

  // --- State from store ---
  readonly loading = this.catalogStore.loading;
  readonly error = this.catalogStore.error;
  readonly items = this.catalogStore.items;
  readonly totalItems = this.catalogStore.totalItems;
  readonly pageIndex = this.catalogStore.pageIndex;
  readonly pageSize = this.catalogStore.pageSize;
  readonly progressByCourseId = this.catalogStore.progressByCourseId;
  readonly completedCourseIds = this.catalogStore.completedCourseIds;

  // ---- Methods ----

  isCourseCompleted(courseId: string): boolean {
    return this.completedCourseIds().has(courseId);
  }

  progressPercent(courseId: string): number {
    return this.progressByCourseId()[courseId] ?? 0;
  }

  onPageChange(event: PageEvent): void {
    this.catalogStore.setPageIndex(event.pageIndex);
    this.catalogStore.setPageSize(event.pageSize);
  }
}
