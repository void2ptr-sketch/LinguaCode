import { TestBed } from '@angular/core/testing';
import type { Route, UrlSegment, PartialMatchRouteSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthStore } from '../services/auth.store';

describe('authGuard', () => {
  const setup = (isAuthenticated: boolean) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => isAuthenticated },
        },
      ],
    });
  };

  const run = (): boolean =>
    TestBed.runInInjectionContext(() =>
      (
        authGuard as (
          route: Route,
          segments: UrlSegment[],
          snapshot: PartialMatchRouteSnapshot,
        ) => boolean
      )({} as Route, [] as UrlSegment[], {} as PartialMatchRouteSnapshot),
    );

  it('allows authenticated user', () => {
    setup(true);
    expect(run()).toBe(true);
  });

  it('redirects unauthenticated user', () => {
    setup(false);
    expect(run()).toBe(false);
  });
});
