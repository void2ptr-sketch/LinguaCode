import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { AppLoggerService } from '../shared/logger/app-logger.service';
import {
  getTestDemoCourseWithLessons,
  seedTestContentCache,
} from '../entities/content-seed/content-seed.test-utils';
import { ContentSeedRepository } from '../entities/content-seed/content-seed.repository';
import { CourseSearchService } from '../entities/course/search/course-search.service';
import { AuthStore } from '../entities/auth/services/auth.store';

describe('Journey page smoke', () => {
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
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
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

  it('should render the journey map for the course from query params', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const courseSearchService = TestBed.inject(CourseSearchService);

    // Mock resolveCourseId to return numeric ID for demo-course
    vi.spyOn(courseSearchService, 'resolveCourseId').mockResolvedValue('1');
    // Mock getById to return demo course
    vi.spyOn(courseSearchService, 'getById').mockResolvedValue(
      getTestDemoCourseWithLessons() as never,
    );
    // Mock getByIdOrNull to return demo course
    vi.spyOn(courseSearchService, 'getByIdOrNull').mockResolvedValue(
      getTestDemoCourseWithLessons() as never,
    );

    await router.navigate(['journey'], { queryParams: { courseId: 'demo-course' } });
    fixture.detectChanges();

    const flushRequests = (): void => {
      for (const request of httpMock.match(() => true)) {
        const url = request.request.url;

        // Mock getById for the resolved course (used by JourneyPageComponent)
        if (url.includes('/courses/1')) {
          request.flush(getTestDemoCourseWithLessons());
          continue;
        }

        request.flush({});
      }
    };

    flushRequests();
    await fixture.whenStable();
    fixture.detectChanges();

    // Second flush for any pending async operations
    flushRequests();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Карта');
    // Query-параметр ?courseId= должен определять содержимое карты,
    // а не активный курс дашборда (fallback по умолчанию — «214 китайских радикалов»).
    expect(text).toContain('Обучение');
    expect(text).not.toContain('214 китайских радикалов');

    httpMock.verify();
    fixture.destroy();
  });
});
