import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { inject } from '@angular/core';

/**
 * Auth guard — redirects unauthenticated users to `/login`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const authGuard: CanMatchFn = (_route, _segments) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  void router.navigate(['/login']);
  return false;
};
