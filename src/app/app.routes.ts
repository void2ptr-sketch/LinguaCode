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
