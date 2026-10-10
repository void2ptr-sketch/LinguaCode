import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import type { LearningResumeTarget } from '../../../../core/domain/learning/learning-resume.utils';
import type { ContinueLinkQueryParams } from '../../types/learning-dashboard.types';

/**
 * Learning continue card component. Displays a card with a "Continue" button that links
 * to the last learning session.
 * @remarks Supports deep linking via `continueQueryParams` and dynamic labels.
 */
@Component({
  selector: 'app-learning-continue-card',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './learning-continue-card.component.html',
  styleUrl: './learning-continue-card.component.scss',
})
export class LearningContinueCardComponent {
  /**
   * Display label for the continue card (e.g., course or lesson title).
   *
   * @remarks
   * Required input. Rendered prominently in the card header.
   */
  readonly label = input.required<string>();
  /**
   * Resume target data for determining the continue link destination.
   *
   * @remarks
   * Used to compute navigation targets and button labels. Defaults to `null`.
   */
  readonly resumeTarget = input<LearningResumeTarget | null>(null);
  /**
   * Pre-computed query parameters for the continue link.
   *
   * @remarks
   * When provided, these params are used directly in the `routerLink` directive
   * instead of being computed from `resumeTarget`. Defaults to `null`.
   */
  readonly continueQueryParams = input<ContinueLinkQueryParams | null>(null);
}
