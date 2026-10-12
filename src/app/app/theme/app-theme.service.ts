import { effect, inject, Injectable } from '@angular/core';

import { UserStore } from '../../core/state';
import { applyColorSchemeToDocument, normalizeColorScheme } from '../../entities/user/lib/app-color-scheme.utils';

/**
 * Service that syncs the application color scheme with user preferences.
 *
 * @remarks
 * Listens to `UserStore.preferences().colorScheme` via an effect and applies
 * the normalized color scheme to the document root on every change.
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly userStore = inject(UserStore);

  constructor() {
    effect(() => {
      applyColorSchemeToDocument(normalizeColorScheme(this.userStore.preferences().colorScheme));
    });
  }
}
