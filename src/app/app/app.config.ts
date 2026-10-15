import {
  ApplicationConfig,
  ErrorHandler,
  Injector,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { provideApiHttp } from './api/provide-api.http';
import { SyncQueueBootstrap } from './sync/sync-queue.bootstrap';
import { ContentSeedRepository } from '../entities/content-seed/content-seed.repository';
import { AuthStore } from '../entities/auth/services/auth.store';
import { migrateUserContentOverlayIfNeeded } from '../entities/user/overlay/user-content-overlay.migration';
import { repairUserContentOverlayIfNeeded } from '../entities/user/overlay/user-content-overlay.repair';
import { AppErrorHandler } from './errors/app-error-handler';
import { environment } from '../../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideRouter(routes),
    provideAnimationsAsync(),
    provideApiHttp(),
    provideServiceWorker('ngsw-worker.js', { enabled: environment.production }),
    provideAppInitializer(async () => {
      // `inject()` работает только синхронно в контексте инъекции.
      // Захватываем Injector до первого `await`, иначе последующие
      // вызовы `inject()` после асинхронной операции падают с NG0203.
      const injector = inject(Injector);

      // Content seed loading is non-blocking — failure doesn't prevent app startup
      injector.get(ContentSeedRepository).preload().catch(() => {
        // Silently ignore — content seed is best-effort, not required for app functionality
      });
      migrateUserContentOverlayIfNeeded();
      repairUserContentOverlayIfNeeded();
      injector.get(SyncQueueBootstrap);
      if (environment.authEnabled) {
        await injector.get(AuthStore).restoreSession();
      }
    }),
  ],
};
