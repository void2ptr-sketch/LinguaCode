import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { CourseIndexEntry } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import type { PageEvent } from '@angular/material/paginator';

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
  // Inputs
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();
  readonly items = input.required<readonly CourseIndexEntry[]>();
  readonly totalItems = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly progressByCourseId = input.required<Readonly<Record<string, number>>>();
  readonly completedCourseIds = input.required<ReadonlySet<string>>();

  // Outputs
  readonly loadRequested = output<void>();
  readonly pageChange = output<PageEvent>();
  readonly startCourse = output<string>();

  // ---- Methods ----

  isCourseCompleted(courseId: string): boolean {
    return this.completedCourseIds().has(courseId);
  }

  progressPercent(courseId: string): number {
    return this.progressByCourseId()[courseId] ?? 0;
  }
}
