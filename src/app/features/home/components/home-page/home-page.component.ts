import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { HomeTab } from '../../types';

/**
 * Home page component. Provides tab navigation between the learning dashboard and progress views.
 * @remarks Uses lazy-loaded route outlets for each tab content.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  /**
   * Available tabs for the home page navigation.
   *
   * @remarks
   * Each tab defines a label, route path, and optionally whether it should be highlighted
   * only on an exact match. The "Обучение" tab uses `exact: true` so it is active only at `/home`,
   * while "Прогресс" is active for `/home/progress` and any sub-routes.
   */
  readonly tabs: readonly HomeTab[] = [
    { label: 'Обучение', path: '/home', exact: true },
    { label: 'Прогресс', path: '/home/progress' },
  ];
}
