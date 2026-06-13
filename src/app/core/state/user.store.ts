import { Injectable, computed, signal } from '@angular/core';
import { CardAppearance, User } from '../models';

const DEFAULT_USER: User = {
  id: 'local-user',
  displayName: 'Ученик',
  preferences: {
    theme: 'azure-blue',
    fontSize: 'md',
  },
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userState = signal<User>(DEFAULT_USER);

  readonly user = this.userState.asReadonly();
  readonly displayName = computed(() => this.user().displayName);
  readonly preferences = computed(() => this.user().preferences);

  updateDisplayName(displayName: string): void {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return;
    }

    this.userState.update((user) => ({ ...user, displayName: trimmed }));
  }

  updatePreferences(preferences: Partial<CardAppearance>): void {
    this.userState.update((user) => ({
      ...user,
      preferences: { ...user.preferences, ...preferences },
    }));
  }
}
