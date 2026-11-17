import { TestBed } from '@angular/core/testing';

import { RoleService } from './role.service';
import { AuthStore } from './auth.store';
import type { AuthUser } from '../model/auth.types';

describe('RoleService', () => {
  const makeUser = (roles: string[] | undefined): AuthUser => ({
    id: 'u1',
    displayName: '',
    email: '',
    roles,
  });

  const setup = (user: AuthUser | null): RoleService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: { user: () => user } }],
    });
    return TestBed.inject(RoleService);
  };

  it('anonymous user — no roles, no permissions', () => {
    const service = setup(null);

    expect(service.roles()).toEqual([]);
    expect(service.isUser()).toBe(false);
    expect(service.isAuthor()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(service.canCreateContent()).toBe(false);
    expect(service.canManageSystem()).toBe(false);
    expect(service.hasRole('ROLE_USER')).toBe(false);
  });

  it('ROLE_USER — basic access only', () => {
    const service = setup(makeUser(['ROLE_USER']));

    expect(service.isUser()).toBe(true);
    expect(service.isAuthor()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(service.canCreateContent()).toBe(false);
    expect(service.canManageSystem()).toBe(false);
    expect(service.hasRole('ROLE_USER')).toBe(true);
  });

  it('ROLE_AUTHOR — can create content, cannot manage system', () => {
    const service = setup(makeUser(['ROLE_AUTHOR']));

    expect(service.isAuthor()).toBe(true);
    expect(service.canCreateContent()).toBe(true);
    expect(service.canManageSystem()).toBe(false);
    expect(service.hasRole('ROLE_AUTHOR')).toBe(true);
  });

  it('ROLE_ADMIN — full access', () => {
    const service = setup(makeUser(['ROLE_ADMIN']));

    expect(service.isAdmin()).toBe(true);
    expect(service.canCreateContent()).toBe(true);
    expect(service.canManageSystem()).toBe(true);
    expect(service.canWriteLanguages()).toBe(true);
    expect(service.hasRole('ROLE_ADMIN')).toBe(true);
  });

  it('user without roles field — treated as no permissions', () => {
    const service = setup(makeUser(undefined));

    expect(service.roles()).toEqual([]);
    expect(service.canCreateContent()).toBe(false);
    expect(service.canManageSystem()).toBe(false);
  });
});
