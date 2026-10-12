import { Component, EventEmitter, Output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CoursePickerComponent } from '../../../../widgets/course-picker/course-picker.component';

/**
 * Section component for course selection in the card select page.
 */
@Component({
  standalone: true,
  selector: 'app-course-picker-section',
  imports: [CoursePickerComponent, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './course-picker-section.component.html',
  styleUrl: './course-picker-section.component.scss',
})
export class CoursePickerSectionComponent {
  /** Selected course ID. */
  readonly selectedCourseId = input.required<string>();

  /** Course title display. */
  readonly courseTitle = input.required<string>();

  /** Hint text for the current step. */
  readonly nextStepHint = input.required<string>();

  /** Whether a course is selected. */
  readonly canAdvanceFromCourse = input.required<boolean>();

  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** Event emitted when a course is selected. */
  @Output() readonly selectedCourseIdChange = new EventEmitter<string>();

  /** Event emitted when the picker label changes. */
  @Output() readonly courseLabelChange = new EventEmitter<string>();

  /** Event emitted when clicking "next". */
  @Output() readonly nextClick = new EventEmitter<void>();

  /** Event emitted when navigating to scenarios tab. */
  @Output() readonly goToScenarios = new EventEmitter<void>();

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Handles course selection. */
  onSelectedCourseIdChange(event: string): void {
    this.selectedCourseIdChange.emit(event);
  }

  /** Handles course label change event. */
  onCourseLabelChange(event: string): void {
    this.courseLabelChange.emit(event);
  }

  /** Handles "next" button click. */
  onNextClick(): void {
    this.nextClick.emit();
  }

  /** Handles navigating to scenarios tab. */
  onGoToScenarios(): void {
    this.goToScenarios.emit();
  }
}
