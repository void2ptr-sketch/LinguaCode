import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import {
  getTestDefaultScenarios,
  getTestDemoCourseWithLessons,
  seedTestContentCache,
} from '../entities/content-seed/content-seed.test-utils';
import { ContentSeedRepository } from '../entities/content-seed/content-seed.repository';
import { AuthStore } from '../entities/auth/services/auth.store';

describe('Home learning dashboard smoke', () => {
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
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ id: 'mock', displayName: 'Test User', email: '', roles: [] }),
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

  it('should render learning dashboard with continue action', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);

    await router.navigate(['home']);
    fixture.detectChanges();

    const flushRequests = (): void => {
      for (const request of httpMock.match(() => true)) {
        const url = request.request.url;

        if (url.includes('/courses/search')) {
          request.flush({
            data: [
              {
                id: '1',
                slug: 'course-cpp-complete',
                title: 'CPP Complete',
                published: true,
              },
              {
                id: '2',
                slug: 'course-zh-radicals-214',
                title: 'Radicals 214',
                published: true,
              },
            ],
            total: 2,
          });
          continue;
        }

        if (url.includes('/courses/')) {
          request.flush(getTestDemoCourseWithLessons());
          continue;
        }

        if (url.includes('/scenarios/')) {
          const scenarios = getTestDefaultScenarios();
          request.flush(
            scenarios.find((scenario) => scenario.id === 'demo-scenario') ?? scenarios[0],
          );
          continue;
        }

        request.flush({});
      }
    };

    // Flush until no pending requests remain (dashboard may trigger multiple rounds)
    let pending = httpMock.match(() => true).length;
    let rounds = 0;
    while (pending > 0 && rounds < 6) {
      flushRequests();
      await fixture.whenStable();
      fixture.detectChanges();
      pending = httpMock.match(() => true).length;
      rounds++;
    }

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Привет');
    expect(text).toContain('Обучение');

    httpMock.verify();
    fixture.destroy();
  });
});
