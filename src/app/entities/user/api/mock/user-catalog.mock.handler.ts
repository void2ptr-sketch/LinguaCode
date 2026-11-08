import { Injectable, inject } from '@angular/core';

import type { User } from '../../model';
import { UserPersistence } from '../../model/user.persistence';

/**
 * Mock handler for user profile operations.
 *
 * @remarks
 * Provides in-memory get/update for the user profile using
 * `UserPersistence` (localStorage) as the data source. Used by
 * `userApiMockInterceptor` to simulate API responses during development.
 */
@Injectable({ providedIn: 'root' })
export class UserCatalogMockHandler {
  private readonly persistence = inject(UserPersistence);

  private user: User | null = null;

  /**
   * Retrieves the current user profile.
   *
   * @returns The user profile, or `null` if no data is stored.
   */
  getMe(): User | null {
    return this.ensureUser();
  }

  /**
   * Updates the current user profile.
   *
   * @param user - The updated user profile.
   * @returns The persisted user profile.
   */
  updateMe(user: User): User {
    this.persistence.save(user);
    this.user = user;
    return user;
  }

  /**
   * Clears the cached user data, forcing a reload on the next operation.
   */
  resetCache(): void {
    this.user = null;
  }

  private ensureUser(): User | null {
    if (this.user) {
      return this.user;
    }
    this.user = this.persistence.load();
    return this.user;
  }
}
