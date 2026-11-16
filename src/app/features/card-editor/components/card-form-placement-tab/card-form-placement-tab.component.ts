import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';

/**
 * Minimal placement fields for the draft.
 *
 * @remarks
 * Contains only the hierarchy reference fields — avoids circular dependency
 * with the full CardDraft type.
 */
export type PlacementDraft = {
  courseId: string | undefined;
  programId: string | undefined;
  lessonId: string | undefined;
  scenarioId: string | undefined;
};

/**
 * Placement tab component for the card form.
 *
 * @remarks
 * Displays and edits the course → program → lesson → scenario hierarchy.
 * The read-only language pair summary lives in the dialog header instead.
 */
@Component({
  selector: 'app-card-form-placement-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './card-form-placement-tab.component.html',
  styleUrl: './card-form-placement-tab.component.scss',
})
export class CardFormPlacementTabComponent {
  /** Required draft containing only placement fields. */
  readonly draft = input.required<PlacementDraft>();

  /** Available courses for the current language pair. */
  readonly availableCourses = input.required<readonly CourseOption[]>();

  /** Available programs for the selected course. */
  readonly availablePrograms = input.required<readonly { id: string; title: string }[]>();

  /** Available lessons for the selected program. */
  readonly availableLessons = input.required<readonly LessonOption[]>();

  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = input.required<readonly ScenarioOption[]>();

  /** Emits the updated course ID. */
  readonly courseIdChange = output<string>();

  /** Emits the updated program ID. */
  readonly programIdChange = output<string>();

  /** Emits the updated lesson ID. */
  readonly lessonIdChange = output<string>();

  /** Emits the updated scenario ID. */
  readonly scenarioIdChange = output<string>();

  /**
   * Updates the selected course and notifies the parent.
   *
   * @param courseId - The selected course ID (empty string to deselect).
   */
  updateCourseId(courseId: string): void {
    this.courseIdChange.emit(courseId);
  }

  /**
   * Updates the selected program and notifies the parent.
   *
   * @param programId - The selected program ID (empty string to deselect).
   */
  updateProgramId(programId: string): void {
    this.programIdChange.emit(programId);
  }

  /**
   * Updates the selected lesson and notifies the parent.
   *
   * @param lessonId - The selected lesson ID (empty string to deselect).
   */
  updateLessonId(lessonId: string): void {
    this.lessonIdChange.emit(lessonId);
  }

  /**
   * Updates the selected scenario.
   *
   * @param scenarioId - The selected scenario ID.
   */
  updateScenarioId(scenarioId: string): void {
    this.scenarioIdChange.emit(scenarioId);
  }
}
