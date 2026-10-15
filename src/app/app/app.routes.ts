import { Routes } from '@angular/router';

/**
 * Корневые маршруты приложения.
 * Все фичи загружаются лениво через `loadComponent` — ни один
 * TypeScript-модуль фичи не попадает в начальный чанк.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../widgets/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'journey', pathMatch: 'full' },

      // ── Home ──────────────────────────────────────────────
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/home/home-page/home-page.component').then(
            (m) => m.HomePageComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import(
                '../features/home/components/home-learning-tab/home-learning-tab.component'
              ).then((m) => m.HomeLearningTabComponent),
          },
          {
            path: 'progress',
            loadComponent: () =>
              import(
                '../features/learning-results/components/learning-progress/learning-progress.component'
              ).then((m) => m.LearningProgressComponent),
          },
          { path: '**', redirectTo: '', pathMatch: 'full' },
        ],
      },

      // ── Home Learning Tab (lazy-loaded sub-routes) ───────────────────────────
      {
        path: 'home-learning-tab',
        loadComponent: () =>
          import(
            '../features/home/components/home-learning-tab/home-learning-tab.component'
          ).then((m) => m.HomeLearningTabComponent),
        children: [
          // ── Continue Tab (lazy-loaded) ───────────────────────────────────────
          {
            path: 'continue',
            loadComponent: () =>
              import(
                '../features/home/components/learning-continue-card/learning-continue-card.component'
              ).then((m) => m.LearningContinueCardComponent),
          },
          // ── Progress Tab (lazy-loaded) ────────────────────────────────────────
          {
            path: 'progress',
            loadComponent: () =>
              import(
                '../features/home/components/learning-program-progress/learning-program-progress.component'
              ).then((m) => m.LearningProgramProgressComponent),
          },
          // ── Roadmap Tab (lazy-loaded) ────────────────────────────────────────
          {
            path: 'roadmap',
            loadComponent: () =>
              import(
                '../features/home/components/learning-lesson-roadmap/learning-lesson-roadmap.component'
              ).then((m) => m.LearningLessonRoadmapComponent),
          },
          { path: '**', redirectTo: 'continue', pathMatch: 'full' },
        ],
      },

      // ── Journey Map ───────────────────────────────────────
      {
        path: 'journey',
        loadComponent: () =>
          import(
            '../pages/journey/journey-page/journey-page.component'
          ).then((m) => m.JourneyPageComponent),
      },

      // ── Card Select ───────────────────────────────────────
      {
        path: 'cards/select',
        loadComponent: () =>
          import(
            '../pages/card-select/card-select-page/card-select-page.component'
          ).then((m) => m.CardSelectPageComponent),
      },

      // ── Course Catalog ────────────────────────────────────
      {
        path: 'courses',
        loadComponent: () =>
          import(
            '../pages/course-catalog/course-catalog-page/course-catalog-page.component'
          ).then((m) => m.CourseCatalogPageComponent),
        children: [
          // ── Course Catalog Tabs (lazy-loaded) ───────────────────────────────────
          {
            path: 'tabs/courses',
            loadComponent: () =>
              import(
                '../features/course-catalog/components/course-card-list/course-card-list.component'
              ).then((m) => m.CourseCatalogCoursesComponent),
          },
          {
            path: 'tabs/settings',
            loadComponent: () =>
              import(
                '../features/course-catalog/components/course-settings/course-settings.component'
              ).then((m) => m.CourseCatalogSettingsComponent),
          },
          {
            path: 'tabs/programs',
            loadComponent: () =>
              import(
                '../features/course-catalog/components/program-list/program-list.component'
              ).then((m) => m.CourseCatalogProgramsComponent),
          },
          { path: '**', redirectTo: 'tabs/courses', pathMatch: 'full' },
        ],
      },

      // ── Course Builder ────────────────────────────────────
      {
        path: 'tools/courses',
        loadComponent: () =>
          import(
            '../pages/course-builder/course-builder-page/course-builder-page.component'
          ).then((m) => m.CourseBuilderPageComponent),
      },

      // ── Scenario Builder ───────────────────────────────────
      {
        path: 'tools/scenario-builder',
        loadComponent: () =>
          import(
            '../pages/scenario-builder/scenario-builder-page/scenario-builder-page.component'
          ).then((m) => m.ScenarioBuilderPageComponent),
      },

      // ── Card Editor ────────────────────────────────────────
      {
        path: 'tools/cards',
        loadComponent: () =>
          import(
            '../pages/card-editor/card-editor-page/card-editor-page.component'
          ).then((m) => m.CardEditorPageComponent),
      },
      { path: 'tools/card-editor', redirectTo: '/tools/cards', pathMatch: 'full' },
      { path: 'tools/card-catalog', redirectTo: '/tools/cards', pathMatch: 'full' },

      // ── Core Pages ────────────────────────────────────────
      {
        path: 'help',
        loadComponent: () =>
          import('../pages/help/help-page.component').then(
            (m) => m.HelpPageComponent,
          ),
      },
      {
        path: 'help/scenarios',
        loadComponent: () =>
          import(
            '../pages/help-usage-scenarios/help-usage-scenarios-page.component'
          ).then((m) => m.HelpUsageScenariosPageComponent),
      },
      {
        path: 'user',
        loadComponent: () =>
          import('../pages/user/user-page.component').then(
            (m) => m.UserPageComponent,
          ),
      },

      { path: '**', redirectTo: 'home' },
    ],
  },
];
