import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';

/**
 * Guard — redirects users without ADMIN role to /journey.
 */
export const adminGuard: CanMatchFn = () => {
  const roleService = inject(RoleService);
  return roleService.canManageSystem();
};
