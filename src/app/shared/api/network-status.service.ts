import { Injectable, signal } from '@angular/core';

/**
 * Tracks the browser connectivity status (`navigator.onLine` + events).
 *
 * @remarks
 * Used by the offline interceptor to fail API requests fast, and by UI
 * components to show offline banners or disable mutating actions.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  /** Whether the client is currently online. */
  readonly online = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }
}
