import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';

/**
 * Guard — redirects users without AUTHOR/ADMIN role to /journey.
 */
export const authorGuard: CanMatchFn = () => {
  const roleService = inject(RoleService);
  return roleService.canCreateContent();
};
