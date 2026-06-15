import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import type { LessonRoadmapItem } from '../../../../core/data/learning-resume.utils';

@Component({
  selector: 'app-learning-lesson-roadmap',
  imports: [RouterLink, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './learning-lesson-roadmap.component.html',
  styleUrl: './learning-lesson-roadmap.component.scss',
})
export class LearningLessonRoadmapComponent {
  readonly items = input.required<readonly LessonRoadmapItem[]>();
  readonly courseId = input.required<string>();
}
