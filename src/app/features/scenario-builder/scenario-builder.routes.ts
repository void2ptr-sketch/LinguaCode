import { Routes } from '@angular/router';

/**
 * Маршруты фичи Scenario Builder:
 * - `/tools/scenario-builder` → ScenarioBuilderPageComponent (lazy)
 */
export const scenarioBuilderRoutes: Routes = [
  {
    path: 'tools/scenario-builder',
    loadComponent: () =>
      import('./components/scenario-builder-page/scenario-builder-page.component').then(
        (m) => m.ScenarioBuilderPageComponent,
      ),
  },
];
