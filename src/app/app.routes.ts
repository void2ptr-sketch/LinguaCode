import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

/**
 * Корневые маршруты приложения.
 * Каждая фича вынесена в собственный `*.routes.ts` файл.
 * Маршруты импортируются напрямую и собираются в один массив.
 */
import { homeRoutes } from './features/home/home.routes';
import { cardSelectRoutes } from './features/card-select/card-select.routes';
import { courseCatalogRoutes } from './features/course-catalog/course-catalog.routes';
import { scenarioBuilderRoutes } from './features/scenario-builder/scenario-builder.routes';
import { courseBuilderRoutes } from './features/course-builder/course-builder.routes';
import { cardEditorRoutes } from './features/card-editor/card-editor.routes';
import { corePagesRoutes } from './core/layout/core-pages.routes';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      ...homeRoutes,
      ...cardSelectRoutes,
      ...courseCatalogRoutes,
      ...scenarioBuilderRoutes,
      ...courseBuilderRoutes,
      ...cardEditorRoutes,
      ...corePagesRoutes,
      { path: '**', redirectTo: 'home' },
    ],
  },
];
