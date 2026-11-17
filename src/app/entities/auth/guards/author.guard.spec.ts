import { TestBed } from '@angular/core/testing';
import type { Route, UrlSegment } from '@angular/router';

import { authorGuard } from './author.guard';
import { AuthStore } from '../services/auth.store';
import type { AuthUser } from '../model/auth.types';

describe('authorGuard', () => {
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
      (authorGuard as unknown as (route: Route, segments: UrlSegment[]) => boolean)(
        {} as Route,
        [] as UrlSegment[],
      ),
    );

  it('allows AUTHOR role', () => {
    setup(['ROLE_AUTHOR']);
    expect(run()).toBe(true);
  });

  it('allows ADMIN role (full access)', () => {
    setup(['ROLE_ADMIN']);
    expect(run()).toBe(true);
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
