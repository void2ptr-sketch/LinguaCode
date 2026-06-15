import { effect, inject, Injectable } from '@angular/core';

import { UserStore } from '../state';
import { applyColorSchemeToDocument, normalizeColorScheme } from './app-color-scheme.utils';

@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly userStore = inject(UserStore);

  constructor() {
    effect(() => {
      applyColorSchemeToDocument(normalizeColorScheme(this.userStore.preferences().colorScheme));
    });
  }
}
