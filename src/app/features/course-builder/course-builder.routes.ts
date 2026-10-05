import { Routes } from '@angular/router';

/**
 * Маршруты фичи Course Builder:
 * - `/tools/courses` → CourseBuilderPageComponent (lazy)
 */
export const courseBuilderRoutes: Routes = [
  {
    path: 'tools/courses',
    loadComponent: () =>
      import('./components/course-builder-page/course-builder-page.component').then(
        (m) => m.CourseBuilderPageComponent,
      ),
  },
];
