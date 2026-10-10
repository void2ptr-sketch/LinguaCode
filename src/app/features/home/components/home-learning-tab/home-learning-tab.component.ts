import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LearningResultsStore, UserStore } from '../../../../core/state';
import { LearningDashboardService } from '../../services/learning-dashboard.service';
import {
  buildContinueLinkQueryParams,
  continueButtonLabel,
} from '../../types/learning-dashboard.types';

/**
 * Home learning tab component. Displays the learning dashboard with course progress,
 * roadmap, and a "Continue" button for resuming the last session.
 * @remarks Reloads automatically when the active language pair or results change.
 */
@Component({
  selector: 'app-home-learning-tab',
  imports: [
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home-learning-tab.component.html',
  styleUrl: './home-learning-tab.component.scss',
})
export class HomeLearningTabComponent {
  private readonly dashboard = inject(LearningDashboardService);
  private readonly userStore = inject(UserStore);
  private readonly resultsStore = inject(LearningResultsStore);

  /**
   * Whether the dashboard is currently loading course data.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.loading`.
   */
  readonly loading = this.dashboard.loading;
  /**
   * Error message if the dashboard failed to load.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.error`.
   */
  readonly error = this.dashboard.error;
  /**
   * Currently loaded course with its lessons.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.course`.
   */
  readonly course = this.dashboard.course;
  /**
   * Resume target for the "Continue" button.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.resumeTarget`.
   */
  readonly resumeTarget = this.dashboard.resumeTarget;
  /**
   * Learning roadmap for the current course.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.roadmap`.
   */
  readonly roadmap = this.dashboard.roadmap;
  /**
   * Overall course progress data.
   *
   * @remarks
   * Tied directly to `LearningDashboardService.courseProgress`.
   */
  readonly courseProgress = this.dashboard.courseProgress;

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;
  /** Formatted language pair label (e.g., "RU → EN"). */
  readonly languagePairLabel = this.userStore.languagePairLabel;

  /**
   * Computed query parameters for the "Continue" link.
   *
   * @remarks
   * Derived from `resumeTarget` via `buildContinueLinkQueryParams`. Returns `null` when
   * there is no valid resume target.
   */
  readonly continueQueryParams = computed(() => buildContinueLinkQueryParams(this.resumeTarget()));
  /**
   * Computed label for the "Continue" button.
   *
   * @remarks
   * Derived from `resumeTarget` via `continueButtonLabel`. Returns localized strings
   * such as "Continue: Lesson · Scenario" or "Start: Lesson".
   */
  readonly continueLabel = computed(() => continueButtonLabel(this.resumeTarget()));
  /**
   * Overall accuracy percentage from the results store.
   *
   * @remarks
   * Expressed as a number between 0 and 100.
   */
  readonly accuracyPercent = this.resultsStore.accuracyPercent;
  /**
   * Total number of learning results.
   *
   * @remarks
   * Exposed as a signal from `LearningResultsStore.totalCount`.
   */
  readonly totalResults = this.resultsStore.totalCount;

  /**
   * Reacts to changes in the active language pair or learning results.
   *
   * @remarks
   * Triggers a full dashboard reload whenever `activeLanguagePairId` or `pairResults` change,
   * ensuring the displayed course data stays in sync with user context.
   */
  private readonly reloadOnContextChange = effect(() => {
    this.userStore.activeLanguagePairId();
    this.resultsStore.pairResults();
    void this.dashboard.reload();
  });

  /**
   * Retries loading the dashboard data after a failure.
   *
   * @remarks
   * Calls `LearningDashboardService.reload()` to refresh the course, roadmap,
   * and resume target. Intended for use by a "Retry" button in the template.
   */
  retryLoad(): void {
    void this.dashboard.reload();
  }
}
