import { Injectable } from '@angular/core';

/**
 * Central logging service.
 *
 * @remarks
 * Wraps console output with an app prefix so logs are greppable, and provides a
 * single integration point for future remote error reporting (e.g. Sentry).
 * All error paths should report through `AppLoggerService.error`.
 */
@Injectable({ providedIn: 'root' })
export class AppLoggerService {
  private readonly prefix = '[LinguaCode]';

  error(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(`${this.prefix} ${message}`, context ?? '');
  }

  warn(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`${this.prefix} ${message}`, context ?? '');
  }

  info(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.info(`${this.prefix} ${message}`, context ?? '');
  }

  debug(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.debug(`${this.prefix} ${message}`, context ?? '');
  }
}
