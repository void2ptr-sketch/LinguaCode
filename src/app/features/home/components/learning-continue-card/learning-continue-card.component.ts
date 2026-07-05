import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { LearningResumeTarget } from '../../../../core/data/learning/learning-resume.utils';
import type { ContinueLinkQueryParams } from '../../types/learning-dashboard.types';

@Component({
  selector: 'app-learning-continue-card',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './learning-continue-card.component.html',
  styleUrl: './learning-continue-card.component.scss',
})
export class LearningContinueCardComponent {
  readonly label = input.required<string>();
  readonly resumeTarget = input<LearningResumeTarget | null>(null);
  readonly continueQueryParams = input<ContinueLinkQueryParams | null>(null);
}
