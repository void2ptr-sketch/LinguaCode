import { Routes } from '@angular/router';

/**
 * Core pages (layout-related):
 * - `/help` → HelpPageComponent (lazy)
 * - `/help/scenarios` → HelpUsageScenariosPageComponent (lazy)
 * - `/user` → UserPageComponent (lazy)
 */
export const corePagesRoutes: Routes = [
  {
    path: 'help',
    loadComponent: () =>
      import('./pages/help-page/help-page.component').then(
        (m) => m.HelpPageComponent,
      ),
  },
  {
    path: 'help/scenarios',
    loadComponent: () =>
      import('./pages/help-usage-scenarios-page/help-usage-scenarios-page.component').then(
        (m) => m.HelpUsageScenariosPageComponent,
      ),
  },
  {
    path: 'user',
    loadComponent: () =>
      import('./pages/user-page/user-page.component').then(
        (m) => m.UserPageComponent,
      ),
  },
];
