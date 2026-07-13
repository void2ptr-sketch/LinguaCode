import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideApiHttp } from './core/api';
import { ContentSeedRepository } from './core/data/content-seed/content-seed.repository';
import { migrateUserContentOverlayIfNeeded } from './core/data/user/user-content-overlay.migration';
import { repairUserContentOverlayIfNeeded } from './core/data/user/user-content-overlay.repair';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideApiHttp(),
    provideAppInitializer(async () => {
      await inject(ContentSeedRepository).preload();
      migrateUserContentOverlayIfNeeded();
      repairUserContentOverlayIfNeeded();
    }),
  ],
};
