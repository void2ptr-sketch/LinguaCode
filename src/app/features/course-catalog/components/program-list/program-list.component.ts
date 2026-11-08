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
import type { Program } from '../../../../entities/program/model';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { ErrorToastService } from '../../../../shared/ui/error-toast/error-toast.service';
import { CourseCatalogStore } from '../../services';

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
  private readonly logger = inject(AppLoggerService);
  private readonly errorToast = inject(ErrorToastService);
  private readonly catalogStore = inject(CourseCatalogStore);

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
  private readonly programs = signal<readonly Program[]>([]);
  /** Whether programs are currently loading. */
  readonly loading = signal(false);
  /** Error message if loading failed. */
  readonly error = signal<string | null>(null);

  /** Whether any course is selected. */
  readonly hasCourses = computed(() => this.courseIds().size > 0);

  /** Total number of programs. */
  readonly totalItems = computed(() => this.programs().length);

  // ---- Lifecycle ----

  /** Loads programs when courseIds changes. */
  private loadPrograms(): void {
    const ids = this.courseIds();
    if (ids.size === 0) {
      this.programs.set([]);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    Promise.all(
      Array.from(ids).map((id) =>
        this.programsApi.getByCourse(id).catch((err) => {
          this.logger.error('Failed to load programs for course', { courseId: id, error: err });
          return [] as readonly Program[];
        }),
      ),
    )
      .then((results) => this.programs.set(results.flat()))
      .finally(() => this.loading.set(false));
  }

  // Watch courseIds changes
  private readonly loadOnCourseIdsChange = effect(() => {
    this.courseIds();
    this.loadPrograms();
  });

  // ---- Methods ----

  /**
   * Returns the number of lessons for a program.
   * Uses program.lessonIds as the source (seed catalog may not have lessons).
   */
  getLessonCount(programId: string): number {
    const program = this.programs().find((p) => p.id === programId);
    return program?.lessonIds?.length ?? 0;
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
