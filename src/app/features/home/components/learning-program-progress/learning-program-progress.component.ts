import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-learning-program-progress',
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './learning-program-progress.component.html',
  styleUrl: './learning-program-progress.component.scss',
})
export class LearningProgramProgressComponent {
  readonly courseTitle = input.required<string>();
  readonly completed = input.required<number>();
  readonly total = input.required<number>();
  readonly percent = input.required<number>();
}
