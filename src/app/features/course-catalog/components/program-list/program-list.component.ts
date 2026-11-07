import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal, effect, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgramsApiService } from '../../../../entities/program/api';
import type { Program } from '../../../../entities/program/model';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { ErrorToastService } from '../../../../shared/ui/error-toast/error-toast.service';

/**
 * Course programs list component. Displays programs for a selected course.
 * @remarks Receives courseId via input and loads programs from the API.
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
  /** ID of the course whose programs to display. Empty means no course selected. */
  readonly courseId = input.required<string>();

  /** Emits when the user clicks "Start" on a program. */
  readonly startProgram = output<string>();

  private readonly programsApi = inject(ProgramsApiService);
  private readonly logger = inject(AppLoggerService);
  private readonly errorToast = inject(ErrorToastService);

  /** Loaded programs for the selected course. */
  private readonly programs = signal<readonly Program[]>([]);
  /** Whether programs are currently loading. */
  readonly loading = signal(false);
  /** Error message if loading failed. */
  readonly error = signal<string | null>(null);

  /** Whether a course is selected. */
  readonly hasCourse = computed(() => this.courseId().length > 0);

  /** Total number of programs. */
  readonly totalItems = computed(() => this.programs().length);

  // ---- Lifecycle ----

  /** Loads programs when courseId changes. */
  private loadPrograms(): void {
    const id = this.courseId();
    if (!id) {
      this.programs.set([]);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.programsApi.getByCourse(id)
      .then((items) => this.programs.set(items))
      .catch((err) => {
        this.logger.error('Failed to load programs for course', { courseId: id, error: err });
        this.error.set('Не удалось загрузить программы курса');
        this.programs.set([]);
      })
      .finally(() => this.loading.set(false));
  }

  // Watch courseId changes
  private readonly loadOnCourseChange = inject(DestroyRef).destroyed;
  private readonly courseIdEffect = effect(() => {
    this.courseId();
    this.loadPrograms();
  });

  // ---- Methods ----

  /**
   * Handles "Start" button click for a program.
   *
   * @param programId - The program ID to start.
   */
  onStartProgram(programId: string): void {
    this.startProgram.emit(programId);
  }
}
