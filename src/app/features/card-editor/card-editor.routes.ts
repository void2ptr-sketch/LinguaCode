import { Routes } from '@angular/router';

/**
 * Маршруты фичи Card Editor:
 * - `/tools/cards` → CardEditorPageComponent (lazy)
 * - `/tools/card-editor` → redirect to `/tools/cards`
 * - `/tools/card-catalog` → redirect to `/tools/cards`
 */
export const cardEditorRoutes: Routes = [
  {
    path: 'tools/cards',
    loadComponent: () =>
      import('./components/card-editor-page/card-editor-page.component').then(
        (m) => m.CardEditorPageComponent,
      ),
  },
  {
    path: 'tools/card-editor',
    redirectTo: '/tools/cards',
    pathMatch: 'full',
  },
  {
    path: 'tools/card-catalog',
    redirectTo: '/tools/cards',
    pathMatch: 'full',
  },
];
