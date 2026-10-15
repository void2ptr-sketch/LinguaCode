import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AppLoggerService } from '../../shared/logger/app-logger.service';
import { ErrorToastService } from '../../shared/ui/error-toast/error-toast.service';

/**
 * Global Angular error handler.
 *
 * @remarks
 * Catches unhandled errors: logs them via `AppLoggerService` and surfaces a
 * user-facing toast via `ErrorToastService`. Kept minimal so that background
 * failures do not crash the UI silently.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly logger = inject(AppLoggerService);
  private readonly toast = inject(ErrorToastService);

  handleError(error: unknown): void {
    this.logger.error('Unhandled error', error);
    this.toast.show(error);
  }
}
