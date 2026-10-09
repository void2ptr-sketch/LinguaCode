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
  /** Available tabs for the home page. */
  readonly tabs: readonly HomeTab[] = [
    { label: 'Обучение', path: '/home', exact: true },
    { label: 'Прогресс', path: '/home/progress' },
  ];
}
