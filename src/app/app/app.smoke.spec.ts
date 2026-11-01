import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { AuthStore } from '../entities/auth/services/auth.store';

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
