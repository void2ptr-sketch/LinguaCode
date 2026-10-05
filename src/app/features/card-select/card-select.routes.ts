import { Routes } from '@angular/router';

/**
 * Маршруты фичи Card Select:
 * - `/cards/select` → CardSelectPageComponent (lazy)
 */
export const cardSelectRoutes: Routes = [
  {
    path: 'cards/select',
    loadComponent: () =>
      import('./components/card-select-page/card-select-page.component').then(
        (m) => m.CardSelectPageComponent,
      ),
  },
];
