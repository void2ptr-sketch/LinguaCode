import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from '../../app.component';
import { routes } from '../../app.routes';
import { provideApiHttp } from '../../core/api';
import { environment } from '../../../environments/environment';
import { resetContentSeedCache } from '../../core/data/content-seed/content-seed.cache';

describe('Card select smoke', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetContentSeedCache();

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
    resetContentSeedCache();
  });

  it('should load scenario cards and render the first question', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);

    // Navigate with query params to pre-select course, lesson, and scenario.
    // This triggers ngOnInit which calls:
    //   onCourseChange('demo-course')
    //     → courseSearchService.getById('demo-course')
    //       → intercepted by scenariosApiMockInterceptor → handler.getById
    //         → ensureData() → contentSeed.preload() → HTTP requests for seed files
    //   applyLessonFromCourse('demo-lesson-1')
    //   onScenarioChange('demo-scenario')
    //     → loadCards → scenarioSearchService.getById('demo-scenario')
    //       → intercepted by scenariosApiMockInterceptor → handler.getById
    //     → cardsApiService.getByIds([...])
    //       → intercepted by cardsApiMockInterceptor → handler.getByIds
    //
    // Only the fixture file requests (content-manifest.json + seed files)
    // reach the HttpTestingController. All /api/* requests are intercepted
    // by the mock interceptors and handled via ContentSeedRepository cache.
    await router.navigateByUrl(
      '/cards/select?courseId=demo-course&lessonId=demo-lesson-1&scenarioId=demo-scenario&tab=learning',
    );
    fixture.detectChanges();

    // ── 1st round: ContentSeedRepository loads content-manifest.json ──
    const manifestReq = httpMock.expectOne(`${environment.fixturesUrl}/content-manifest.json`);
    expect(manifestReq.request.method).toBe('GET');
    manifestReq.flush({
      version: 1,
      cardFiles: [
        '/cards/demo-cards.json',
        '/cards/radicals-course-cards.json',
        '/cards/perl-interview-cards.json',
        '/cards/perl-db-cards.json',
      ],
      scenarioFiles: [
        '/scenarios/demo-scenarios.json',
        '/scenarios/radicals-scenarios.json',
        '/scenarios/perl-interview-scenarios.json',
        '/scenarios/perl-db-scenarios.json',
      ],
      courseFiles: [
        '/courses/demo-courses.json',
        '/courses/radicals-214-course.json',
        '/courses/perl-interview-course.json',
        '/courses/perl-db-course.json',
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    // ── 2nd round: ContentSeedRepository loads all seed files ──
    // Scenario files
    httpMock
      .expectOne(`${environment.fixturesUrl}/scenarios/demo-scenarios.json`)
      .flush({
        scenarios: [
          {
            id: 'demo-scenario',
            title: 'Демо-сценарий',
            description: '3 карточки для начала обучения (ru→en): выбор ответа.',
            authorId: 'system',
            published: true,
            updatedAt: '2026-01-01T00:00:00.000Z',
            cardSource: { mode: 'fixed', cardIds: ['select-1', 'select-2', 'select-3'] },
            languagePair: { known: 'ru', learning: 'en' },
            courseId: 'demo-course',
          },
        ],
      });
    httpMock.expectOne(`${environment.fixturesUrl}/scenarios/radicals-scenarios.json`).flush({ scenarios: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/scenarios/perl-interview-scenarios.json`).flush({ scenarios: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/scenarios/perl-db-scenarios.json`).flush({ scenarios: [] });

    // Course files
    httpMock
      .expectOne(`${environment.fixturesUrl}/courses/demo-courses.json`)
      .flush({
        courses: [
          {
            id: 'demo-course',
            title: 'Демо: базовый English',
            description: 'Вводная учебная программа для курса ru→en.',
            authorId: 'system',
            languagePair: { known: 'ru', learning: 'en' },
            lessonIds: ['demo-lesson-1', 'demo-lesson-2'],
            published: true,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        lessons: [
          {
            id: 'demo-lesson-1',
            courseId: 'demo-course',
            title: 'Приветствия',
            description: 'Первые сценарии приветствия.',
            scenarioIds: ['demo-scenario'],
            prerequisiteLessonIds: [],
            order: 0,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'demo-lesson-2',
            courseId: 'demo-course',
            title: 'Повторение',
            description: 'Закрепление после первого урока.',
            scenarioIds: ['demo-scenario'],
            prerequisiteLessonIds: ['demo-lesson-1'],
            order: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
    httpMock.expectOne(`${environment.fixturesUrl}/courses/radicals-214-course.json`).flush({ courses: [], lessons: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/courses/perl-interview-course.json`).flush({ courses: [], lessons: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/courses/perl-db-course.json`).flush({ courses: [], lessons: [] });

    // Card files
    httpMock
      .expectOne(`${environment.fixturesUrl}/cards/demo-cards.json`)
      .flush({
        cards: [
          {
            id: 'select-1',
            kind: 'select',
            title: 'Приветствие',
            courseId: 'demo-course',
            lessonId: 'demo-lesson-2',
            scenarioId: 'demo-scenario',
            appearance: { theme: 'azure-blue', fontSize: 'md' },
            direction: 'known-to-learning',
            promptKnown: 'Как сказать «Привет» по-английски?',
            optionsLearning: ['Hello', 'Goodbye', 'Thanks', 'Please'],
            optionsKnown: ['Привет', 'Пока', 'Спасибо', 'Пожалуйста'],
            correctIndex: 0,
            meta: { knownLanguage: 'ru', learningLanguage: 'en', difficulty: 'beginner', tags: [] },
          },
          {
            id: 'select-2',
            kind: 'select',
            title: 'Числа',
            courseId: 'demo-course',
            lessonId: 'demo-lesson-2',
            scenarioId: 'demo-scenario',
            appearance: { theme: 'azure-blue', fontSize: 'md' },
            direction: 'known-to-learning',
            promptKnown: 'Как будет «один» по-английски?',
            optionsLearning: ['One', 'Two', 'Three', 'Four'],
            optionsKnown: ['один', 'два', 'три', 'четыре'],
            correctIndex: 0,
            meta: { knownLanguage: 'ru', learningLanguage: 'en', difficulty: 'beginner', tags: [] },
          },
          {
            id: 'select-3',
            kind: 'select',
            title: 'Прощание',
            courseId: 'demo-course',
            lessonId: 'demo-lesson-2',
            scenarioId: 'demo-scenario',
            appearance: { theme: 'azure-blue', fontSize: 'md' },
            direction: 'known-to-learning',
            promptKnown: 'Как сказать «До свидания» по-английски?',
            optionsLearning: ['Goodbye', 'Hello', 'Thanks', 'Please'],
            optionsKnown: ['До свидания', 'Привет', 'Спасибо', 'Пожалуйста'],
            correctIndex: 0,
            meta: { knownLanguage: 'ru', learningLanguage: 'en', difficulty: 'beginner', tags: [] },
          },
        ],
      });
    httpMock.expectOne(`${environment.fixturesUrl}/cards/radicals-course-cards.json`).flush({ cards: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/cards/perl-interview-cards.json`).flush({ cards: [] });
    httpMock.expectOne(`${environment.fixturesUrl}/cards/perl-db-cards.json`).flush({ cards: [] });

    // After all seed files are loaded, the ContentSeedRepository cache is populated.
    // The mock interceptors can now serve API requests from the cache.
    // We need multiple detectChanges + whenStable cycles for the async ngOnInit chain
    // to complete (onCourseChange → applyLessonFromCourse → onScenarioChange → loadCards).
    for (let i = 0; i < 10; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    // ── Assertions ──
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Практика');
    expect(text).toContain('Демо-сценарий');
    expect(text).toContain('Как сказать «Привет» по-английски?');
    expect(text).toContain('Hello');

    httpMock.verify();
  });
});
