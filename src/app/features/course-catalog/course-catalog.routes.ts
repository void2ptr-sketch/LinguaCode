import { Routes } from '@angular/router';

/**
 * Маршруты фичи Course Catalog:
 * - `/courses` → CourseCatalogPageComponent (lazy)
 */
export const courseCatalogRoutes: Routes = [
  {
    path: 'courses',
    loadComponent: () =>
      import('./components/course-catalog-page/course-catalog-page.component').then(
        (m) => m.CourseCatalogPageComponent,
      ),
  },
];
