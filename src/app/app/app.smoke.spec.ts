import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { AuthStore } from '../entities/auth/services/auth.store';
import { LanguageService } from '../entities/language-pair/services/language.service';
import { AvailablePairsService } from '../entities/language-pair/services/available-pairs.service';
import { signal, computed } from '@angular/core';

describe('App smoke', () => {
  beforeEach(async () => {
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

  it('should render home route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['home']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Привет');
    expect(text).toContain('Обучение');

    fixture.destroy();
  });

  it('should render user profile route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['user']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Профиль пользователя');

    fixture.destroy();
  });

  it('should redirect unknown routes to home', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['unknown-route']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/home');
    expect(fixture.nativeElement.textContent).toContain('Привет');

    fixture.destroy();
  });
});
