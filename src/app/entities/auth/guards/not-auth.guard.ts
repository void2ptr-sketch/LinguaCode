import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { inject } from '@angular/core';

/**
 * Redirects authenticated users away from `/login` to `/journey`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const notAuthGuard: CanMatchFn = (_route, _segments) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    void router.navigate(['/journey']);
    return false;
  }

  return true;
};
