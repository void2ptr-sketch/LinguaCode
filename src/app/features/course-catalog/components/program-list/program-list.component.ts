import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  signal,
  effect,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgramsApiService } from '../../../../entities/program/api';
import type { ProgramWithLessons } from '../../../../entities/program/model';
import { CourseSearchService } from '../../../../entities/course';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { ErrorToastService } from '../../../../shared/ui/error-toast/error-toast.service';
import { CourseCatalogStore } from '../../services';
import { environment } from '../../../../../environments/environment';

/**
 * Course programs list component. Displays programs for selected courses.
 * @remarks Receives courseIds via input and loads programs from the API.
 */
@Component({
  selector: 'app-course-catalog-programs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './program-list.component.html',
  styleUrl: './program-list.component.scss',
})
export class CourseCatalogProgramsComponent {
  /** IDs of courses whose programs to display. Empty means no courses selected. */
  readonly courseIds = input.required<ReadonlySet<string>>();

  /** Emits when the user clicks "Start" on a program. */
  readonly startProgram = output<string>();

  private readonly programsApi = inject(ProgramsApiService);
  private readonly courseSearch = inject(CourseSearchService);
  private readonly logger = inject(AppLoggerService);
  private readonly errorToast = inject(ErrorToastService);
  private readonly catalogStore = inject(CourseCatalogStore);

  /**
   * Whether courses are served by the local mock backend (seed data with
   * string slug IDs). In mock mode slug IDs are valid for the programs API;
   * against the real backend only numeric IDs (BIGINT PK) are accepted.
   */
  private readonly coursesMockEnabled = environment.useCoursesApiMock;

  /** Map of course ID → title from the catalog (keys normalized to string). */
  private readonly courseTitleMap = computed(() => {
    const items = this.catalogStore.items();
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(String(item.id), item.title);
    }
    return map;
  });

  /** Loaded programs for the selected courses. */
  private readonly programs = signal<readonly ProgramWithLessons[]>([]);
  /** Whether programs are currently loading. */
  readonly loading = signal(false);
  /** Error message if loading failed. */
  readonly error = signal<string | null>(null);

  /** Whether any course is selected. */
  readonly hasCourses = computed(() => this.courseIds().size > 0);

  /** Total number of programs. */
  readonly totalItems = computed(() => this.programs().length);

  // ---- Lifecycle ----

  /**
   * Resolves a course ID for the programs API.
   *
   * @remarks
   * Mirrors `CourseSearchService.resolveCourseIdForWrite`: when the mock
   * backend serves courses (seed data with string slug IDs), the ID passes
   * through unchanged — the mock programs API understands slugs. Otherwise
   * slug IDs are resolved to the numeric form required by the real backend;
   * numeric IDs always pass through.
   */
  private async resolveCourseId(courseId: string): Promise<string> {
    if (this.coursesMockEnabled || /^\d+$/.test(courseId)) {
      return courseId;
    }
    const resolved = await this.courseSearch.resolveCourseId(courseId);
    return resolved ?? courseId;
  }

  /** Loads programs when courseIds changes. */
  private async loadPrograms(): Promise<void> {
    const ids = this.courseIds();
    if (ids.size === 0) {
      this.programs.set([]);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const results: ProgramWithLessons[] = [];
      for (const id of ids) {
        const resolvedId = await this.resolveCourseId(id);
        // Real backend requires numeric IDs (BIGINT PK). Non-numeric slugs
        // are only valid when the mock backend serves the data.
        if (!resolvedId || (!this.coursesMockEnabled && !/^\d+$/.test(resolvedId))) {
          this.logger.warn(`[ProgramList] Skipping course with non-numeric resolved ID: "${id}" → "${resolvedId}"`);
          continue;
        }
        try {
          const programs = await this.programsApi.getByCourse(resolvedId);
          results.push(...programs);
        } catch (err) {
          this.logger.error('Failed to load programs for course', {
            originalId: id,
            resolvedId,
            error: err,
          });
        }
      }
      this.programs.set(results);
    } finally {
      this.loading.set(false);
    }
  }

  // Watch courseIds changes
  private readonly loadOnCourseIdsChange = effect(() => {
    this.courseIds();
    void this.loadPrograms();
  });

  // ---- Methods ----

  /**
    * Returns the number of lessons for a program.
    * Uses program.lessons as the source (resolved by the API).
    */
  getLessonCount(programId: string): number {
    const program = this.programs().find((p) => p.id === programId);
    return program?.lessons?.length ?? 0;
  }

  /**
   * Declines "урок" correctly: 1 урок, 2 урока, 5 уроков, нет уроков.
   */
  declineLesson(count: number): string {
    if (count === 0) return 'нет уроков';

    const abs = Math.abs(count) % 100;
    const lastDigit = abs % 10;

    if (abs > 10 && abs < 20) return `${count} уроков`;
    if (lastDigit > 1 && lastDigit < 5) return `${count} урока`;
    if (lastDigit === 1) return `${count} урок`;
    return `${count} уроков`;
  }

  /**
   * Normalizes a course ID to string for map lookup.
   */
  normalizeCourseId(courseId: string | number): string {
    return String(courseId);
  }

  /**
   * Handles "Start" button click for a program.
   *
   * @param courseId - The parent course ID to start (program belongs to a course).
   */
  onStartProgram(courseId: string): void {
    this.startProgram.emit(courseId);
  }
}
