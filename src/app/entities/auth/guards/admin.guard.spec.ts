import { TestBed } from '@angular/core/testing';
import type { Route, UrlSegment } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthStore } from '../services/auth.store';
import type { AuthUser } from '../model/auth.types';

describe('adminGuard', () => {
  const setup = (roles: string[] | undefined) => {
    TestBed.resetTestingModule();
    const user: AuthUser | null =
      roles === undefined ? null : { id: 'u1', displayName: '', email: '', roles };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: { user: () => user } }],
    });
  };

  const run = (): boolean =>
    TestBed.runInInjectionContext(() =>
      (adminGuard as unknown as (route: Route, segments: UrlSegment[]) => boolean)(
        {} as Route,
        [] as UrlSegment[],
      ),
    );

  it('allows ADMIN role', () => {
    setup(['ROLE_ADMIN']);
    expect(run()).toBe(true);
  });

  it('blocks AUTHOR role (hierarchy: author has no system rights)', () => {
    setup(['ROLE_AUTHOR']);
    expect(run()).toBe(false);
  });

  it('blocks ROLE_USER', () => {
    setup(['ROLE_USER']);
    expect(run()).toBe(false);
  });

  it('blocks anonymous user', () => {
    setup(undefined);
    expect(run()).toBe(false);
  });
});
