import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import type { LessonRoadmapItem } from '../../../../core/data/learning/learning-resume.utils';

/**
 * Learning lesson roadmap component. Displays a list of lessons with progress indicators
 * and links to resume learning.
 * @remarks Items are derived from the learning dashboard service.
 */
@Component({
  selector: 'app-learning-lesson-roadmap',
  imports: [RouterLink, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './learning-lesson-roadmap.component.html',
  styleUrl: './learning-lesson-roadmap.component.scss',
})
export class LearningLessonRoadmapComponent {
  /** Required list of lesson roadmap items with progress data. */
  readonly items = input.required<readonly LessonRoadmapItem[]>();
  /** Required course ID for navigation context. */
  readonly courseId = input.required<string>();
}
