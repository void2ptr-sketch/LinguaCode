import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttpTesting } from './api/provide-api.http';
import { environment } from '../../environments/environment';
import { resetContentSeedCache } from '../entities/content-seed/content-seed.cache';
import { ContentSeedRepository } from '../entities/content-seed/content-seed.repository';
import { LanguagePairsApiService } from '../entities/language-pair/api';
import { AuthStore } from '../entities/auth/services/auth.store';
import { UserPreferencesSyncService } from '../entities/user/services/user-preferences-sync.service';

describe('Card select smoke', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetContentSeedCache();

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
            user: () => ({ id: 'mock', displayName: 'Test User', email: '', roles: [] }),
            logout: () => Promise.resolve(),
          },
        },
        {
          provide: UserPreferencesSyncService,
          useValue: {
            selectedCourseId: () => null,
            loadPreferences: () => Promise.resolve(),
            saveSelectedCourse: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    // Clear IndexedDB snapshot so seed loads from HTTP fixtures
    const seedRepo = TestBed.inject(ContentSeedRepository);
    await seedRepo.resetForTests();
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
    await router.navigate(['cards', 'select'], {
      queryParams: {
        courseId: 'demo-course',
        lessonId: 'demo-lesson-1',
        scenarioId: 'demo-scenario',
        tab: 'learning',
      },
    });
    fixture.detectChanges();

    // ── 1st round: ContentSeedRepository loads content-manifest.json ──
    const manifestReq = httpMock.expectOne(`${environment.fixturesUrl}/content-manifest.json`);
    expect(manifestReq.request.method).toBe('GET');
    manifestReq.flush({
      version: 1,
      courseFiles: [
        '/courses/demo-courses.json',
        '/courses/radicals-214-course.json',
        '/courses/perl-interview-course.json',
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    // ── 2nd round: ContentSeedRepository loads course fixtures (all data in one file) ──
    httpMock.expectOne(`${environment.fixturesUrl}/courses/demo-courses.json`).flush({
      formatVersion: 2,
      exportedAt: '2026-01-01T00:00:00.000Z',
      course: {
        id: 'demo-course',
        title: 'Демо: базовый English',
        description: 'Вводная учебная программа для курса ru→en.',
        languagePair: { source: 'ru', target: 'en' },
        published: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
        authoring: {
          idea: '',
          status: 'materialized',
          ideaUpdatedAt: '',
          materializedAt: '',
          lastError: null,
        },
      },
      title: 'Демо: базовый English',
      description: 'Вводная учебная программа для курса ru→en.',
      languagePair: { source: 'ru', target: 'en' },
      published: true,
      authoring: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
      programs: [
        {
          program: {
            id: 'demo-program',
            title: 'Демо: базовый English',
            description: '',
            order: 0,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          order: 0,
          lessons: [
            {
              lesson: {
                id: 'demo-lesson-1',
                title: 'Приветствия',
                description: 'Первые сценарии приветствия.',
                order: 0,
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              order: 0,
              scenarios: [
                {
                  scenario: {
                    id: 'demo-scenario',
                    title: 'Демо-сценарий',
                    description: '3 карточки для начала обучения (ru→en): выбор ответа.',
                    order: 0,
                    published: true,
                    updatedAt: '2026-01-01T00:00:00.000Z',
                    cardSource: {
                      mode: 'fixed' as const,
                      cardIds: ['select-1', 'select-2', 'select-3'],
                    },
                  },
                  order: 0,
                  cards: [
                    {
                      card: {
                        id: 'select-1',
                        kind: 'select',
                        title: 'Приветствие',
                        appearance: { theme: 'azure-blue', fontSize: 'md' },
                        direction: 'known-to-learning' as const,
                        promptKnown: 'Как сказать «Привет» по-английски?',
                        optionsLearning: ['Hello', 'Goodbye', 'Thanks', 'Please'],
                        optionsKnown: ['Привет', 'Пока', 'Спасибо', 'Пожалуйста'],
                        correctIndex: 0,
                      },
                      order: 0,
                    },
                    {
                      card: {
                        id: 'select-2',
                        kind: 'select',
                        title: 'Числа',
                        appearance: { theme: 'azure-blue', fontSize: 'md' },
                        direction: 'known-to-learning' as const,
                        promptKnown: 'Как будет «один» по-английски?',
                        optionsLearning: ['One', 'Two', 'Three', 'Four'],
                        optionsKnown: ['один', 'два', 'три', 'четыре'],
                        correctIndex: 0,
                      },
                      order: 1,
                    },
                    {
                      card: {
                        id: 'select-3',
                        kind: 'select',
                        title: 'Прощание',
                        appearance: { theme: 'azure-blue', fontSize: 'md' },
                        direction: 'known-to-learning' as const,
                        promptKnown: 'Как сказать «До свидания» по-английски?',
                        optionsLearning: ['Goodbye', 'Hello', 'Thanks', 'Please'],
                        optionsKnown: ['До свидания', 'Привет', 'Спасибо', 'Пожалуйста'],
                        correctIndex: 0,
                      },
                      order: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    httpMock
      .expectOne(`${environment.fixturesUrl}/courses/radicals-214-course.json`)
      .flush({ courses: [], lessons: [] });
    httpMock
      .expectOne(`${environment.fixturesUrl}/courses/perl-interview-course.json`)
      .flush({ courses: [], lessons: [] });
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
    // Текст карточки может отличаться, проверяем наличие ключевых слов
    expect(text).toMatch(/Как сказать.*по-английски/i);
    expect(text).toContain('Hello');

    httpMock.verify();
    fixture.destroy();
  });
});
