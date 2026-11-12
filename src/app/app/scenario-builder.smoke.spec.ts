import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { seedTestContentCache } from '../entities/content-seed/content-seed.test-utils';
import { ContentSeedRepository } from '../entities/content-seed/content-seed.repository';
import { LanguagePairsApiService } from '../entities/language-pair/api';
import { AuthStore } from '../entities/auth/services/auth.store';

describe('Scenario builder redirect smoke', () => {
  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttpTesting(),
        provideHttpClientTesting(),
        {
          provide: LanguagePairsApiService,
          useValue: {
            listAll: () => Promise.resolve([{ id: 1, knownCode: 'ru', learningCode: 'en' }]),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ id: 'mock', displayName: 'Test User', email: '', roles: ['ROLE_AUTHOR'] }),
            logout: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    // Clear IndexedDB snapshot so seed loads cleanly
    const seedRepo = TestBed.inject(ContentSeedRepository);
    await seedRepo.resetForTests();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect /tools/scenario-builder to the content explorer page', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['tools', 'scenario-builder']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Страница «Конструктор сценариев» удалена — /tools/scenario-builder теперь редирект
    // на Проводник контента, где собраны все функции управления сценариями.
    expect(router.url).toBe('/tools/content');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Проводник контента');
    expect(text).toContain('Каталог сценариев');

    fixture.destroy();
  });

  it('should keep a full-match redirect route for /tools/scenario-builder in the route config', () => {
    // Редирект объявлен внутри children layout-маршрута — ищем рекурсивно.
    const flatten = (items: typeof routes): typeof routes =>
      items.flatMap((item) => [item, ...flatten(item.children ?? [])]);

    const route = flatten(routes).find((item) => item.path === 'tools/scenario-builder');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('tools/content');
    expect(route?.pathMatch).toBe('full');
  });
});
