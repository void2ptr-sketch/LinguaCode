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

describe('Course builder redirect smoke', () => {
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
            user: () => ({
              id: 'mock',
              displayName: 'Test User',
              email: '',
              roles: ['ROLE_AUTHOR'],
            }),
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

  it('should redirect /tools/courses to the content explorer page', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['tools', 'courses']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Страница «Конструктор курсов» удалена — /tools/courses теперь редирект
    // на Проводник контента, где собраны все функции управления курсами.
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Проводник контента');
    expect(text).toContain('Создать курс');

    fixture.destroy();
  });
});
