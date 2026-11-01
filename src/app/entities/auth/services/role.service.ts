import { Injectable, computed, inject } from '@angular/core';

import { AuthStore } from './auth.store';

/**
 * User roles available in the system.
 *
 * @remarks
 * ROLE_USER — basic access (create pairs, select languages)
 * ROLE_ADMIN — full access (CRUD for languages/pairs)
 */
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

/**
 * Service for managing user roles and permissions.
 *
 * @remarks
 * Reads roles from `AuthStore.user().roles` and provides computed
 * permission signals for UI gating.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly authStore = inject(AuthStore);

  /** All roles assigned to the current user. */
  readonly roles = computed(() => {
    const user = this.authStore.user();
    return user?.roles ?? [];
  }) as import('@angular/core').Signal<string[]>;

  /** Whether the user has the ADMIN role. */
  readonly isAdmin = computed(() => this.roles().includes('ROLE_ADMIN'));

  /** Whether the user has the USER role. */
  readonly isUser = computed(() => this.roles().includes('ROLE_USER'));

  /** Whether the user can perform write operations on languages. */
  readonly canWriteLanguages = computed(() => this.isAdmin());

  /** Whether the user can perform write operations on language pairs. */
  readonly canWritePairs = computed(() => this.isAdmin() || this.isUser());

  /**
   * Checks if the user has a specific role.
   *
   * @param role - The role code to check.
   * @returns `true` if the user has the role.
   */
  hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }
}
