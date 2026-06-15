import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from '../../app.component';
import { routes } from '../../app.routes';
import { provideApiHttp } from '../../core/api';
import { DEFAULT_COURSE_CATALOG } from '../../core/data/courses-storage';
import { DEFAULT_SCENARIOS } from '../../core/data/scenario-catalog.defaults';

describe('Home learning dashboard smoke', () => {
  beforeEach(async () => {
    localStorage.clear();

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
          request.flush({
            ...DEFAULT_COURSE_CATALOG.courses[0],
            lessons: DEFAULT_COURSE_CATALOG.lessons.filter((lesson) => lesson.courseId === 'demo-course'),
          });
          continue;
        }

        if (url.includes('/scenarios/demo-scenario')) {
          request.flush(
            DEFAULT_SCENARIOS.find((scenario) => scenario.id === 'demo-scenario') ?? DEFAULT_SCENARIOS[0],
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
