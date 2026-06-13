import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttp } from './core/api';

describe('App smoke', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttp(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should render home route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/home');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Добро пожаловать');
    expect(fixture.nativeElement.textContent).toContain('изучения языков');
  });

  it('should render user profile route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/user');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Профиль пользователя');
  });

  it('should redirect unknown routes to home', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/unknown-route');
    fixture.detectChanges();

    expect(router.url).toBe('/home');
    expect(fixture.nativeElement.textContent).toContain('Добро пожаловать');
  });
});
