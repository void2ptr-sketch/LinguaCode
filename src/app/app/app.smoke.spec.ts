import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { signal, computed } from '@angular/core';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { AuthStore } from '../entities/auth/services/auth.store';
import { LanguageService } from '../entities/language-pair/services/language.service';
import { AvailablePairsService } from '../entities/language-pair/services/available-pairs.service';

// Warm the lazily loaded route chunks before the tests run.
//
// Every route in `routes` is declared with `loadComponent`, so the router
// resolves a dynamic `import()` of the page module graph *inside the test
// body*. On a loaded CI worker that cold transform/import can exceed the
// default 5 s test timeout and fail the smoke test even though the page
// renders fine. Importing the same modules here (identical resolved module
// ids) moves that work into the spec's module-loading phase, so the router's
// `import()` hits the module registry cache immediately.
import '../widgets/main-layout/main-layout.component';
import '../pages/home/home-page/home-page.component';
import '../pages/user/user-page/user-page.component';

/** Upper bound for a single `whenStable()` wait (see {@link settle}). */
const STABLE_TIMEOUT_MS = 2000;

/** Explicit timeout for route-render tests (cold chunk loading on CI is slower than 5 s). */
const ROUTE_TEST_TIMEOUT_MS = 20_000;

/**
 * Flushes pending Angular work without ever hanging.
 *
 * @param fixture - Fixture whose stability should be awaited.
 * @param timeoutMs - Maximum time to wait for the app to become stable.
 *
 * @remarks
 * `fixture.whenStable()` resolves only once Angular has no pending tasks. A
 * pending task leaked by an unrelated test can therefore keep it unresolved
 * forever, which used to surface as `Test timed out in 5000ms`. The smoke
 * assertions below only depend on the already-rendered DOM, so a bounded wait
 * is enough: it gives async work a chance to settle and then moves on.
 */
async function settle(
  fixture: ComponentFixture<unknown>,
  timeoutMs = STABLE_TIMEOUT_MS,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });

  try {
    await Promise.race([fixture.whenStable(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

describe('App smoke', () => {
  beforeEach(async () => {
    // `UserStore` reads persisted state on creation — start from a clean slate.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttpTesting(),
        provideHttpClientTesting(),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ id: 'mock', displayName: 'Test User', email: '', roles: [] }),
            logout: () => Promise.resolve(),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({
              afterClosed: () => of(true as boolean),
              afterOpened: of(),
              backdropClick: of(),
              close: () => void 0,
            }),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            languages: signal([]),
            loading: signal(false),
            loaded: signal(true),
            load: () => Promise.resolve(),
            getCodes: () => [],
            getLabels: () => ({}),
            findByCode: () => undefined,
            isValid: () => false,
          },
        },
        {
          provide: AvailablePairsService,
          useValue: {
            pairs: signal([]),
            loading: signal(false),
            loaded: signal(true),
            visiblePairs: computed(() => []),
            load: () => Promise.resolve(),
            invalidate: () => void 0,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it(
    'should render home route',
    async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const router = TestBed.inject(Router);

      await router.navigate(['home']);
      fixture.detectChanges();
      await settle(fixture);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Привет');
      expect(text).toContain('Обучение');

      fixture.destroy();
    },
    ROUTE_TEST_TIMEOUT_MS,
  );

  it(
    'should render user profile route',
    async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const router = TestBed.inject(Router);

      await router.navigate(['user']);
      fixture.detectChanges();
      await settle(fixture);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Профиль пользователя');

      fixture.destroy();
    },
    ROUTE_TEST_TIMEOUT_MS,
  );

  it(
    'should redirect unknown routes to home',
    async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const router = TestBed.inject(Router);

      await router.navigate(['unknown-route']);
      fixture.detectChanges();
      await settle(fixture);
      fixture.detectChanges();

      expect(router.url).toBe('/home');
      expect(fixture.nativeElement.textContent).toContain('Привет');

      fixture.destroy();
    },
    ROUTE_TEST_TIMEOUT_MS,
  );
});
