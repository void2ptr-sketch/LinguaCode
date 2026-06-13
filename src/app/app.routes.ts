import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/components/home-page/home-page.component').then(
            (m) => m.HomePageComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/home/components/home-welcome-tab/home-welcome-tab.component').then(
                (m) => m.HomeWelcomeTabComponent,
              ),
          },
          {
            path: 'progress',
            loadComponent: () =>
              import(
                './features/learning-results/components/learning-progress/learning-progress.component'
              ).then((m) => m.LearningProgressComponent),
          },
          {
            path: 'sections',
            loadComponent: () =>
              import(
                './features/home/components/home-sections-tab/home-sections-tab.component'
              ).then((m) => m.HomeSectionsTabComponent),
          },
        ],
      },
      {
        path: 'cards/select',
        loadComponent: () =>
          import(
            './features/card-select/components/card-select-page/card-select-page.component'
          ).then((m) => m.CardSelectPageComponent),
      },
      {
        path: 'tools/scenario-builder',
        loadComponent: () =>
          import(
            './features/scenario-builder/components/scenario-builder-page/scenario-builder-page.component'
          ).then((m) => m.ScenarioBuilderPageComponent),
      },
      {
        path: 'tools/card-editor',
        loadComponent: () =>
          import(
            './features/card-editor/components/card-editor-page/card-editor-page.component'
          ).then((m) => m.CardEditorPageComponent),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./core/layout/pages/help-page/help-page.component').then(
            (m) => m.HelpPageComponent,
          ),
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./core/layout/pages/user-page/user-page.component').then(
            (m) => m.UserPageComponent,
          ),
      },
      { path: '**', redirectTo: 'home' },
    ],
  },
];
