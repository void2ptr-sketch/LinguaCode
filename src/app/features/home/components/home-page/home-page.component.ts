import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { LearningResultsStore, UserStore } from '../../../../core/state';

@Component({
  selector: 'app-home-page',
  imports: [MatCardModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly userStore = inject(UserStore);
  private readonly resultsStore = inject(LearningResultsStore);

  readonly displayName = this.userStore.displayName;
  readonly totalResults = this.resultsStore.totalCount;
  readonly correctResults = this.resultsStore.correctCount;
}
