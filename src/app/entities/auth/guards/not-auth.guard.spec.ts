import { TestBed } from '@angular/core/testing';
import type { Route, UrlSegment, PartialMatchRouteSnapshot } from '@angular/router';

import { notAuthGuard } from './not-auth.guard';
import { AuthStore } from '../services/auth.store';

describe('notAuthGuard', () => {
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
        notAuthGuard as (
          route: Route,
          segments: UrlSegment[],
          snapshot: PartialMatchRouteSnapshot,
        ) => boolean
      )({} as Route, [] as UrlSegment[], {} as PartialMatchRouteSnapshot),
    );

  it('should return true when user is not authenticated', () => {
    setup(false);
    expect(run()).toBe(true);
  });

  it('should return false when user is authenticated', () => {
    setup(true);
    expect(run()).toBe(false);
  });
});
