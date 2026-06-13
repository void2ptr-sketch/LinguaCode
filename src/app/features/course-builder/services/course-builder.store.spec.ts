import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourseSearchService } from '../../../core/data';
import { UserStore } from '../../../core/state';
import { CourseBuilderStore } from './course-builder.store';

describe('CourseBuilderStore', () => {
  let store: CourseBuilderStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CourseBuilderStore,
        UserStore,
        CourseSearchService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(CourseBuilderStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should load course index from API scoped to active pair', async () => {
    const loadPromise = store.loadList();

    const request = httpMock.expectOne(
      (req) =>
        req.url.includes('/courses/search') &&
        req.params.get('scope') === 'mine' &&
        req.params.get('knownLanguage') === 'ru' &&
        req.params.get('learningLanguage') === 'en',
    );
    request.flush({
      data: {
        items: [
          {
            id: 'c1',
            title: 'Test course',
            authorId: 'local-user',
            lessonCount: 2,
            published: false,
            updatedAt: '2026-01-01T00:00:00.000Z',
            languagePairSummary: 'Русский → English',
          },
        ],
        page: 0,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    await loadPromise;

    expect(store.indexItems().length).toBe(1);
    expect(store.indexItems()[0].title).toBe('Test course');
  });
});
