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

  readonly loading = this.dashboard.loading;
  readonly error = this.dashboard.error;
  readonly course = this.dashboard.course;
  readonly resumeTarget = this.dashboard.resumeTarget;
  readonly roadmap = this.dashboard.roadmap;
  readonly courseProgress = this.dashboard.courseProgress;

  readonly displayName = this.userStore.displayName;
  readonly languagePairLabel = this.userStore.languagePairLabel;

  readonly continueQueryParams = computed(() => buildContinueLinkQueryParams(this.resumeTarget()));
  readonly continueLabel = computed(() => continueButtonLabel(this.resumeTarget()));
  readonly accuracyPercent = this.resultsStore.accuracyPercent;
  readonly totalResults = this.resultsStore.totalCount;

  private readonly reloadOnContextChange = effect(() => {
    this.userStore.activeLanguagePairId();
    this.resultsStore.pairResults();
    void this.dashboard.reload();
  });

  retryLoad(): void {
    void this.dashboard.reload();
  }
}
