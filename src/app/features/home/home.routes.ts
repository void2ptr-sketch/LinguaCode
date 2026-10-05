import { Routes } from '@angular/router';

/**
 * Маршруты фичи Home:
 * - `/home` → HomePageComponent (lazy)
 *   - `/home` (default) → HomeLearningTabComponent (lazy)
 *   - `/home/progress` → LearningProgressComponent (lazy)
 */
export const homeRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./components/home-learning-tab/home-learning-tab.component').then(
            (m) => m.HomeLearningTabComponent,
          ),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import(
            '../learning-results/components/learning-progress/learning-progress.component'
          ).then((m) => m.LearningProgressComponent),
      },
      { path: '**', redirectTo: '', pathMatch: 'full' },
    ],
  },
];
