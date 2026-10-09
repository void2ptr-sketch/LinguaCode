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
  /** Required course title displayed in the card header. */
  readonly courseTitle = input.required<string>();
  /** Required number of completed cards. */
  readonly completed = input.required<number>();
  /** Required total number of cards in the course. */
  readonly total = input.required<number>();
  /** Required completion percentage (0-100). */
  readonly percent = input.required<number>();
}
