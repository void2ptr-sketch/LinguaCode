import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Learning program progress component. Displays a progress bar with course title
 * and completion statistics (completed/total cards).
 * @remarks Purely presentational; receives all data via inputs.
 */
@Component({
  selector: 'app-learning-program-progress',
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './learning-program-progress.component.html',
  styleUrl: './learning-program-progress.component.scss',
})
export class LearningProgramProgressComponent {
  /**
   * Required course title displayed in the card header.
   *
   * @remarks
   * Rendered as the primary heading of the progress card.
   */
  readonly courseTitle = input.required<string>();
  /**
   * Required number of completed cards.
   *
   * @remarks
   * Used alongside `total` to display a fraction (e.g., "12 / 50 cards").
   */
  readonly completed = input.required<number>();
  /**
   * Required total number of cards in the course.
   *
   * @remarks
   * Used alongside `completed` to display a fraction and compute the progress bar value.
   */
  readonly total = input.required<number>();
  /**
   * Required completion percentage (0-100).
   *
   * @remarks
   * Drives the `mat-progress-bar` value attribute.
   */
  readonly percent = input.required<number>();
}
