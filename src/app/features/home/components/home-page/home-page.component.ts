import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UserStore } from '../../../../core/state';
import { LearningProgressComponent } from '../../../learning-results/components/learning-progress/learning-progress.component';

@Component({
  selector: 'app-home-page',
  imports: [MatCardModule, LearningProgressComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
}
