import { Component, EventEmitter, Output, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LessonPickerComponent } from '../../../../widgets/lesson-picker/lesson-picker.component';
import type { LessonPickPayload } from '../../../../widgets/lesson-picker/lesson-picker.component';

/**
 * Section component for lesson selection in the card select page.
 */
@Component({
  standalone: true,
  selector: 'app-lesson-picker-section',
  imports: [MatCardModule, MatIconModule, LessonPickerComponent],
  templateUrl: './lesson-picker-section.component.html',
  styleUrl: './lesson-picker-section.component.scss',
})
export class LessonPickerSectionComponent {
  /** Selected course ID. */
  readonly selectedCourseId = input.required<string>();

  /** Selected lesson ID. */
  readonly selectedLessonId = input.required<string>();

  /** Whether to enforce lesson prerequisites. */
  readonly enforcePrerequisites = input.required<boolean>();

  /** Hint text for the next step. */
  readonly nextStepHint = input.required<string>();

  /** Whether the user can advance from the lessons tab. */
  readonly canAdvanceFromLessons = input.required<boolean>();

  /** Event emitted when a lesson is selected. */
  @Output() readonly selectedLessonIdChange = new EventEmitter<string>();

  /** Event emitted when a lesson is picked. */
  @Output() readonly lessonPickChange = new EventEmitter<LessonPickPayload>();

  /** Event emitted when clicking "go to course". */
  @Output() readonly goToCourse = new EventEmitter<void>();

  /** Event emitted when clicking "next". */
  @Output() readonly nextClick = new EventEmitter<void>();

  /** Handles lesson selection. */
  onSelectedLessonIdChange(event: string): void {
    this.selectedLessonIdChange.emit(event);
  }

  /** Handles lesson pick event. */
  onLessonPickChange(event: LessonPickPayload): void {
    this.lessonPickChange.emit(event);
  }

  /** Handles "go to course" button click. */
  onGoToCourse(): void {
    this.goToCourse.emit();
  }

  /** Handles "next" button click. */
  onNextClick(): void {
    this.nextClick.emit();
  }
}
