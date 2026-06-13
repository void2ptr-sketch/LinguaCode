import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UserStore } from '../../../../core/state';

@Component({
  selector: 'app-home-welcome-tab',
  imports: [MatCardModule],
  templateUrl: './home-welcome-tab.component.html',
  styleUrl: './home-welcome-tab.component.scss',
})
export class HomeWelcomeTabComponent {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
}
