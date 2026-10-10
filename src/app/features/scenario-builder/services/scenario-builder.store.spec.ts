import { vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import type { Scenario } from '../../../core/models';
import { CardsCatalogMockHandler } from '../../../core/api';
import { CardSearchService, CourseSearchService, ScenarioSearchService } from '../../../core/data';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderStore } from './scenario-builder.store';

describe('ScenarioBuilderStore', () => {
  let store: ScenarioBuilderStore;

  const mockScenarioSearchService = {
    search: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockCardSearchService = {
    search: vi.fn(),
    getCardById: vi.fn(),
  };

  const mockCourseSearchService = {
    search: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockCardsCatalogHandler = {
    getIndexEntry: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ScenarioBuilderStore,
        { provide: ScenarioSearchService, useValue: mockScenarioSearchService },
        { provide: CardSearchService, useValue: mockCardSearchService },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: CardsCatalogMockHandler, useValue: mockCardsCatalogHandler },
        UserStore,
      ],
    });

    store = TestBed.inject(ScenarioBuilderStore);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should load scenario index from API scoped to active pair', async () => {
    mockScenarioSearchService.search.mockResolvedValue({
      items: [
        {
          id: 's1',
          title: 'Test',
          authorId: 'local-user',
          cardSourceMode: 'fixed',
          cardSourceSummary: '1 карточек',
          published: false,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      page: 0,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });

    await store.loadList();

    expect(store.indexItems().length).toBe(1);
    expect(store.indexItems()[0].title).toBe('Test');
    expect(mockScenarioSearchService.search).toHaveBeenCalled();
  });

  it('should set error message when loading list fails', async () => {
    mockScenarioSearchService.search.mockRejectedValue(new Error('Server error'));

    await store.loadList();

    expect(store.error()).toBe('Не удалось загрузить список сценариев');
    expect(store.loading()).toBe(false);
  });

  it('should set loading to true while loading', async () => {
    let resolveFn: () => void;
    const promise = new Promise<void>((resolve) => { resolveFn = resolve; });

    mockScenarioSearchService.search.mockReturnValue(promise);

    const loadPromise = store.loadList();

    expect(store.loading()).toBe(true);

    resolveFn!();

    await loadPromise;
    expect(store.loading()).toBe(false);
  });

  it('should load courses for the current language pair', async () => {
    mockCourseSearchService.search.mockResolvedValue({
      items: [
        {
          id: 'c1',
          title: 'Course One',
          authorId: 'local-user',
          lessonCount: 3,
          published: true,
          updatedAt: '2026-01-01T00:00:00.000Z',
          languagePairSummary: 'Русский → English',
        },
      ],
      page: 0,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1,
    });

    await store.loadCourses();

    expect(store.courses().length).toBe(1);
    expect(store.courses()[0].title).toBe('Course One');
  });

  it('should set empty courses array when loading fails', async () => {
    store.courses.set([{
      id: 'existing',
      title: 'X',
      authorId: 'u',
      lessonCount: 0,
      published: false,
      updatedAt: '',
      languagePairSummary: 'RU → EN',
    }]);

    mockCourseSearchService.search.mockRejectedValue(new Error('Error'));

    await store.loadCourses();

    expect(store.courses()).toEqual([]);
  });

  it('should set list query and reset page index', () => {
    store.setListQuery('test search');
    expect(store.listQuery()).toBe('test search');
    expect(store.pageIndex()).toBe(0);
  });

  it('should set list scope and reset page index', () => {
    store.setListScope('all');
    expect(store.listScope()).toBe('all');
    expect(store.pageIndex()).toBe(0);
  });

  it('should set page parameters', () => {
    store.setPage(5, 25);
    expect(store.pageIndex()).toBe(5);
    expect(store.pageSize()).toBe(25);
  });

  it('should enter create mode and reset editor state', () => {
    store.startCreate();
    expect(store.editorMode()).toBe('create');
    expect(store.editingScenarioId()).toBeNull();
    expect(store.editingScenario()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('should enter edit mode and load scenario', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable Scenario',
      authorId: 'local-user',
      description: 'Test',
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await store.startEdit('s1');

    expect(store.editorMode()).toBe('edit');
    expect(store.editingScenarioId()).toBe('s1');
    expect(store.editingScenario()?.title).toBe('Editable Scenario');
  });

  it('should set error when loading scenario fails', async () => {
    mockScenarioSearchService.getById.mockRejectedValue(new Error('Not found'));

    await store.startEdit('missing-id');

    expect(store.error()).toBe('Не удалось загрузить сценарий');
    expect(store.editorLoading()).toBe(false);
  });

  it('should cancel editing and return to list mode', () => {
    store.editingScenarioId.set('s1');
    store.editingScenario.set({} as Scenario);
    store.editorMode.set('edit');
    store.error.set('some error');

    store.cancelEdit();

    expect(store.editorMode()).toBe('list');
    expect(store.editingScenarioId()).toBeNull();
    expect(store.editingScenario()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('should compute isReadOnly as false when no scenario is being edited', () => {
    store.editingScenario.set(null);
    expect(store.isReadOnly()).toBe(false);
  });

  it('should compute isReadOnly as false when user is the author', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'My Scenario',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    await store.startEdit('s1');
    expect(store.isReadOnly()).toBe(false);
  });

  it('should compute isReadOnly as true when user is not the author', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Other Scenario',
      authorId: 'other-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    await store.startEdit('s1');
    expect(store.isReadOnly()).toBe(true);
  });

  it('should return card title from API or fall back to cardId', async () => {
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card Title' });

    const title = await store.cardTitle('c1');
    expect(title).toBe('Card Title');
  });

  it('should fall back to cardId when card lookup fails', async () => {
    mockCardSearchService.getCardById.mockRejectedValue(new Error('Not found'));

    const title = await store.cardTitle('missing-card');
    expect(title).toBe('missing-card');
  });

  it('should validate fixed card IDs and return only valid ones', async () => {
    mockCardSearchService.getCardById
      .mockResolvedValueOnce({ id: 'c1', title: 'Card 1' })
      .mockResolvedValueOnce({ id: 'c2', title: 'Card 2' })
      .mockRejectedValueOnce(new Error('Not found'));

    const valid = await store.validateFixedCardIds(['c1', 'c2', 'missing']);
    expect(valid).toEqual(['c1', 'c2']);
  });

  it('should load and reload list when setting course filter', async () => {
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    await store.setListCourseId('course-123');

    expect(store.listCourseId()).toBe('course-123');
    expect(store.pageIndex()).toBe(0);
  });

  it('should load courses when calling load()', async () => {
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    mockCourseSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 100,
      totalItems: 0,
      totalPages: 0,
    });

    await store.load();
  });
});
