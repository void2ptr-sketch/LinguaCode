import { TestBed } from '@angular/core/testing';

import { CardSearchService } from '../../core/data';
import { CourseSearchService } from '../../core/data/courses/course-search.service';
import { CardCatalogSearchStore } from './card-catalog-search.store';

describe('CardCatalogSearchStore', () => {
  let store: CardCatalogSearchStore;

  const searchMock = jasmine.createSpy('search').and.resolveTo({
    items: [],
    page: 0,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    facets: { kinds: [], tags: [] },
  });

  const courseSearchMock = jasmine.createSpyObj('CourseSearchService', ['search', 'getById'], {
    loading: () => false,
    error: () => null,
  });
  courseSearchMock.search.and.resolveTo({ items: [], page: 0, pageSize: 100, totalItems: 0, totalPages: 0 });
  courseSearchMock.getById.and.resolveTo({
    id: 'course-1',
    title: 'Course 1',
    lessons: [],
  });

  beforeEach(() => {
    searchMock.calls.reset();
    courseSearchMock.search.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        CardCatalogSearchStore,
        {
          provide: CardSearchService,
          useValue: { search: searchMock, loading: () => false, error: () => null },
        },
        {
          provide: CourseSearchService,
          useValue: courseSearchMock,
        },
      ],
    });

    store = TestBed.inject(CardCatalogSearchStore);
  });

  it('should lock pair on initWithActivePair and pass criteria to search', async () => {
    await store.initWithActivePair('ru', 'en');

    expect(store.pairLocked()).toBe(true);
    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('en');
    expect(searchMock).toHaveBeenCalledWith(
      jasmine.objectContaining({ knownLanguage: 'ru', learningLanguage: 'en' }),
    );
  });

  it('should preserve locked pair in clearFilters', async () => {
    await store.initWithActivePair('ru', 'zh');
    store.setQuery('hello');
    store.setDifficulty('beginner');

    store.clearFilters();

    expect(store.query()).toBe('');
    expect(store.difficulty()).toBeNull();
    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('zh');
    expect(store.pairLocked()).toBe(true);
  });

  it('should ignore manual language changes when pair is locked', async () => {
    await store.initWithActivePair('ru', 'en');
    const callsBefore = searchMock.calls.count();

    store.setKnownLanguage('zh');
    store.setLearningLanguage('zh');

    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('en');
    expect(searchMock.calls.count()).toBe(callsBefore);
  });

  it('should include course/lesson/scenario in criteria when set', async () => {
    await store.initWithActivePair('ru', 'en');
    searchMock.calls.reset();

    await store.setCourse('course-1');
    await store.setLesson('lesson-1');
    store.setScenario('scenario-1');

    expect(searchMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
      }),
    );
  });

  it('should cascade reset lesson and scenario when course changes', async () => {
    await store.initWithActivePair('ru', 'en');
    await store.setCourse('course-1');
    await store.setLesson('lesson-1');
    store.setScenario('scenario-1');

    await store.setCourse('course-2');

    expect(store.selectedLessonId()).toBeNull();
    expect(store.selectedScenarioId()).toBeNull();
  });

  it('should cascade reset scenario when lesson changes', async () => {
    await store.initWithActivePair('ru', 'en');
    await store.setCourse('course-1');
    await store.setLesson('lesson-1');
    store.setScenario('scenario-1');

    await store.setLesson('lesson-2');

    expect(store.selectedScenarioId()).toBeNull();
  });
});
