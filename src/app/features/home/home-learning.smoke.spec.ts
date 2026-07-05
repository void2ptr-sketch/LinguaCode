import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from '../../app.component';
import { routes } from '../../app.routes';
import { provideApiHttp } from '../../core/api';
import {
  getTestDefaultScenarios,
  getTestDemoCourseWithLessons,
  seedTestContentCache,
} from '../../core/data/content-seed/content-seed.test-utils';

describe('Home learning dashboard smoke', () => {
  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttp(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render learning dashboard with continue action', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);

    await router.navigateByUrl('/home');
    fixture.detectChanges();

    const flushRequests = (): void => {
      for (const request of httpMock.match(() => true)) {
        const url = request.request.url;

        if (url.includes('/courses/search')) {
          request.flush({
            items: [
              {
                id: 'demo-course',
                title: 'Демо: базовый English',
                authorId: 'local-user',
                lessonCount: 2,
                languagePairSummary: 'Русский → English',
                published: true,
              },
            ],
            totalItems: 1,
            page: 0,
            pageSize: 1,
          });
          continue;
        }

        if (url.includes('/courses/demo-course')) {
          request.flush(getTestDemoCourseWithLessons());
          continue;
        }

        if (url.includes('/scenarios/demo-scenario')) {
          const scenarios = getTestDefaultScenarios();
          request.flush(
            scenarios.find((scenario) => scenario.id === 'demo-scenario') ?? scenarios[0],
          );
          continue;
        }

        request.flush({});
      }
    };

    flushRequests();
    await fixture.whenStable();
    fixture.detectChanges();

    flushRequests();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Привет');
    expect(text).toContain('Программа');
    expect(text).toContain('Начать');

    httpMock.verify();
  });
});
