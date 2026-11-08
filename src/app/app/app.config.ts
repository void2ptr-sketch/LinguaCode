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
import { LanguageService } from '../entities/language-pair/lib';
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

      // Content seed loading — awaited so buildNodes() sees populated cache
      // Failure doesn't prevent app startup (best-effort content)
      await injector
        .get(ContentSeedRepository)
        .preload()
        .catch(() => {
          // Silently ignore — content seed is best-effort, not required for app functionality
        });
      migrateUserContentOverlayIfNeeded();
      repairUserContentOverlayIfNeeded();
      injector.get(SyncQueueBootstrap);
      if (environment.authEnabled) {
        await injector.get(AuthStore).restoreSession();
      }
      // Load languages (non-blocking — UI handles loading state).
      // Only for authenticated users (or when auth is disabled): the backend
      // returns 403 for unauthenticated /languages requests, and `LanguageService`
      // swallows errors while marking the cache as loaded — leaving it empty.
      if (!environment.authEnabled || injector.get(AuthStore).isAuthenticated()) {
        injector.get(LanguageService).load();
      }
    }),
  ],
};
