import { vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import type { Scenario } from '../../../entities/scenario/model';
import { CardsCatalogMockHandler } from '../../../entities/card/api/mock';
import { CardSearchService } from '../../../entities/card';
import { CourseSearchService } from '../../../entities/course';
import { ScenarioSearchService } from '../../../entities/scenario';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
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
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
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
    let resolveFn: ((value: unknown) => void) | undefined;
    const promise = new Promise<unknown>((resolve) => {
      resolveFn = resolve;
    });

    mockScenarioSearchService.search.mockReturnValue(
      promise as ReturnType<typeof mockScenarioSearchService.search>,
    );

    const loadPromise = store.loadList();

    expect(store.loading()).toBe(true);

    resolveFn!({ items: [], totalItems: 0 });

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
          programCount: 3,
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
    store.courses.set([
      {
        id: 'existing',
        title: 'X',
        authorId: 'u',
        programCount: 0,
        published: false,
        updatedAt: '',
        languagePairSummary: 'RU → EN',
      },
    ]);

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

  // ── createScenario ──

  it('should create a scenario successfully and reload list', async () => {
    mockScenarioSearchService.create.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });

    const result = await store.createScenario({
      title: 'New Scenario',
      description: 'Desc',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(true);
    expect(mockScenarioSearchService.create).toHaveBeenCalled();
    expect(store.editorMode()).toBe('list');
  });

  it('should return false and set error when creation fails', async () => {
    mockScenarioSearchService.create.mockRejectedValue(new Error('Conflict'));
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });

    const result = await store.createScenario({
      title: 'New Scenario',
      description: 'Desc',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось создать сценарий');
  });

  it('should return false when draft has empty title', async () => {
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });

    const result = await store.createScenario({
      title: '   ',
      description: 'Desc',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Укажите название сценария');
  });

  // ── updateScenario ──

  it('should update a scenario successfully', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });
    mockScenarioSearchService.update.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });

    await store.startEdit('s1');

    const result = await store.updateScenario('s1', {
      title: 'Updated',
      description: 'New desc',
      languagePair: { known: 'ru', learning: 'en' },
      published: true,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(true);
    expect(mockScenarioSearchService.update).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ title: 'Updated' }),
    );
  });

  it('should return false when updating read-only scenario', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Other',
      authorId: 'other-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    await store.startEdit('s1');
    expect(store.isReadOnly()).toBe(true);

    const result = await store.updateScenario('s1', {
      title: 'Updated',
      description: '',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: [] },
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Нельзя изменять чужой сценарий');
  });

  it('should return false when update fails', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });
    mockScenarioSearchService.update.mockRejectedValue(new Error('Server error'));
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });

    await store.startEdit('s1');

    const result = await store.updateScenario('s1', {
      title: 'Updated',
      description: '',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось сохранить сценарий');
  });

  // ── deleteScenario ──

  it('should delete a scenario and reload list', async () => {
    mockScenarioSearchService.delete.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    store.indexItems.set([
      {
        id: 's1',
        title: 'Mine',
        authorId: 'local-user',
        cardSourceMode: 'fixed',
        cardSourceSummary: '0 карточек',
        published: false,
        updatedAt: '',
      },
    ]);

    await store.deleteScenario('s1');

    expect(mockScenarioSearchService.delete).toHaveBeenCalledWith('s1');
  });

  it('should prevent deleting another user scenario', async () => {
    store.indexItems.set([
      {
        id: 's1',
        title: 'Other',
        authorId: 'other-user',
        cardSourceMode: 'fixed',
        cardSourceSummary: '0 карточек',
        published: false,
        updatedAt: '',
      },
    ]);

    await store.deleteScenario('s1');

    expect(mockScenarioSearchService.delete).not.toHaveBeenCalled();
    expect(store.error()).toBe('Нельзя удалять чужой сценарий');
  });

  it('should cancel edit when deleting the currently edited scenario', async () => {
    mockScenarioSearchService.delete.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    store.indexItems.set([
      {
        id: 's1',
        title: 'Mine',
        authorId: 'local-user',
        cardSourceMode: 'fixed',
        cardSourceSummary: '0 карточек',
        published: false,
        updatedAt: '',
      },
    ]);

    await store.deleteScenario('s1');

    expect(store.editorMode()).toBe('list');
    expect(store.editingScenarioId()).toBeNull();
  });

  it('should handle delete failure gracefully', async () => {
    mockScenarioSearchService.delete.mockRejectedValue(new Error('Network error'));

    store.indexItems.set([
      {
        id: 's1',
        title: 'Mine',
        authorId: 'local-user',
        cardSourceMode: 'fixed',
        cardSourceSummary: '0 карточек',
        published: false,
        updatedAt: '',
      },
    ]);

    await store.deleteScenario('s1');

    expect(store.error()).toBe('Не удалось удалить сценарий');
  });

  // ── buildSnapshotFromCriteria ──

  it('should return null when criteria has no filters', async () => {
    const result = await store.buildSnapshotFromCriteria({}, 10);
    expect(result).toBeNull();
    expect(store.error()).toBe('Укажите критерии перед созданием snapshot');
  });

  it('should return null when no cards match criteria', async () => {
    mockCardSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    const result = await store.buildSnapshotFromCriteria({ query: 'test' }, 10);
    expect(result).toBeNull();
    expect(store.error()).toBe('По критериям не найдено карточек');
  });

  // ── normalizeCardSource — criteria mode ──

  it('should normalize criteria card source with trimmed query', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });
    mockCardSearchService.search.mockResolvedValue({
      items: [{ id: 'c1', title: 'C1' }],
      page: 0,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
    mockCardsCatalogHandler.getIndexEntry.mockResolvedValue({
      id: 'c1',
      knownLanguage: 'ru',
      learningLanguage: 'en',
    });
    mockScenarioSearchService.update.mockResolvedValue(undefined);

    await store.startEdit('s1');

    const result = await store.updateScenario('s1', {
      title: 'Criteria Scenario',
      description: '',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: {
        mode: 'criteria',
        criteria: {
          knownLanguage: 'ru',
          learningLanguage: 'en',
          query: '  test  ',
        },
        limit: 5,
      },
    });

    // criteria mode doesn't validate card IDs or language pair match
    expect(result).toBe(true);
    expect(mockScenarioSearchService.update).toHaveBeenCalled();
  });

  // ── normalizeCardSource — snapshot mode ──

  it('should normalize snapshot card source', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });
    mockCardsCatalogHandler.getIndexEntry.mockResolvedValue({
      id: 'c1',
      knownLanguage: 'ru',
      learningLanguage: 'en',
    });
    mockScenarioSearchService.update.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    await store.startEdit('s1');

    const result = await store.updateScenario('s1', {
      title: 'Snapshot Scenario',
      description: '',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: {
        mode: 'snapshot',
        cardIds: ['c1'],
        criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
        frozenAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(result).toBe(true);
  });

  // ── validateCardIdsMatchPair — mismatch ──

  it('should return error when card IDs do not match language pair', async () => {
    mockScenarioSearchService.getById.mockResolvedValue({
      id: 's1',
      title: 'Editable',
      authorId: 'local-user',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });
    mockCardSearchService.getCardById.mockResolvedValue({ id: 'c1', title: 'Card 1' });
    mockCardsCatalogHandler.getIndexEntry.mockResolvedValue({
      id: 'c1',
      source: { knownLanguage: 'zh', learningLanguage: 'ja' },
    });
    mockScenarioSearchService.update.mockResolvedValue(undefined);
    mockScenarioSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    await store.startEdit('s1');

    const result = await store.updateScenario('s1', {
      title: 'Mismatch',
      description: '',
      languagePair: { known: 'ru', learning: 'en' },
      published: false,
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Карточка c1 не соответствует курсу сценария');
  });
});
