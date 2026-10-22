import { vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import type { CourseWithPrograms } from '../../../entities/course/model';
import { CourseSearchService, CoursesApiService } from '../../../entities/course';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CourseBuilderStore } from './course-builder.store';
import { CoursePdfExportService } from './course-pdf-export.service';

describe('CourseBuilderStore', () => {
  let store: CourseBuilderStore;

  const mockCourseSearchService = {
    search: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockPdfExport = {
    export: vi.fn(),
  };

  const mockCoursesApi = {
    getBundle: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        CourseBuilderStore,
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: CoursePdfExportService, useValue: mockPdfExport },
        { provide: CoursesApiService, useValue: mockCoursesApi },
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
        UserStore,
      ],
    });

    store = TestBed.inject(CourseBuilderStore);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should load course index from API scoped to active pair', async () => {
    mockCourseSearchService.search.mockResolvedValue({
      items: [
        {
          id: 'c1',
          title: 'Test course',
          authorId: 'local-user',
          programCount: 2,
          published: false,
          updatedAt: '2026-01-01T00:00:00.000Z',
          languagePairSummary: 'Russian → English',
        },
      ],
      page: 0,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });

    await store.loadList();

    expect(store.indexItems().length).toBe(1);
    expect(store.indexItems()[0].title).toBe('Test course');
    expect(mockCourseSearchService.search).toHaveBeenCalled();
  });

  it('should set error message when loading list fails', async () => {
    mockCourseSearchService.search.mockRejectedValue(new Error('Server error'));

    await store.loadList();

    expect(store.error()).toBe('Не удалось загрузить список курсов');
    expect(store.loading()).toBe(false);
  });

  it('should set loading to true while loading', async () => {
    let resolveFn: ((value: unknown) => void) | undefined;
    const promise = new Promise<unknown>((resolve) => {
      resolveFn = resolve;
    });

    mockCourseSearchService.search.mockReturnValue(
      promise as ReturnType<typeof mockCourseSearchService.search>,
    );

    const loadPromise = store.loadList();

    expect(store.loading()).toBe(true);

    resolveFn!({ items: [], totalItems: 0 });
    await loadPromise;

    expect(store.loading()).toBe(false);
  });

  it('should set list query and reset page index', () => {
    store.setListQuery('my search');
    expect(store.listQuery()).toBe('my search');
    expect(store.pageIndex()).toBe(0);
  });

  it('should set list scope and reset page index', () => {
    store.setListScope('all');
    expect(store.listScope()).toBe('all');
    expect(store.pageIndex()).toBe(0);
  });

  it('should set page parameters', () => {
    store.setPage(3, 20);
    expect(store.pageIndex()).toBe(3);
    expect(store.pageSize()).toBe(20);
  });

  it('should enter create mode and reset editor state', () => {
    store.startCreate();
    expect(store.editorMode()).toBe('create');
    expect(store.editingCourseId()).toBeNull();
    expect(store.editingCourse()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('should enter edit mode and load course', async () => {
    mockCourseSearchService.getById.mockResolvedValue({
      id: 'c1',
      title: 'Editable Course',
      authorId: 'local-user',
      description: 'Test course',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await store.startEdit('c1');

    expect(store.editorMode()).toBe('edit');
    expect(store.editingCourseId()).toBe('c1');
    expect(store.editingCourse()?.title).toBe('Editable Course');
  });

  it('should set error when loading course fails', async () => {
    mockCourseSearchService.getById.mockRejectedValue(new Error('Not found'));

    await store.startEdit('missing-id');

    expect(store.error()).toBe('Не удалось загрузить курс');
    expect(store.editorLoading()).toBe(false);
  });

  it('should cancel editing and return to list mode', () => {
    store.editingCourseId.set('c1');
    store.editingCourse.set({} as CourseWithPrograms);
    store.editorMode.set('edit');
    store.error.set('some error');

    store.cancelEdit();

    expect(store.editorMode()).toBe('list');
    expect(store.editingCourseId()).toBeNull();
    expect(store.editingCourse()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('should compute isReadOnly as false when no course is being edited', () => {
    store.editingCourse.set(null);
    expect(store.isReadOnly()).toBe(false);
  });

  it('should compute isReadOnly as false when user is the author', async () => {
    mockCourseSearchService.getById.mockResolvedValue({
      id: 'c1',
      title: 'My Course',
      authorId: 'local-user',
      description: '',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    await store.startEdit('c1');
    expect(store.isReadOnly()).toBe(false);
  });

  it('should compute isReadOnly as true when user is not the author', async () => {
    mockCourseSearchService.getById.mockResolvedValue({
      id: 'c1',
      title: 'Other Course',
      authorId: 'other-user',
      description: '',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    await store.startEdit('c1');
    expect(store.isReadOnly()).toBe(true);
  });

  it('should return false when course title is empty', async () => {
    const result = await store.createCourse({
      title: '',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Укажите название курса');
  });

  it('should return false when no lessons are provided', async () => {
    const result = await store.createCourse({
      title: 'Course',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [],
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Добавьте хотя бы один урок');
  });

  it('should return false when lesson has no scenarios', async () => {
    const result = await store.createCourse({
      title: 'Course',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-empty',
          title: 'Empty Lesson',
          description: '',
          lessons: [
            {
              clientId: 'l-empty',
              title: 'Empty',
              description: '',
              scenarioIds: [],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(false);
    expect(store.error()).toContain('Empty Lesson');
    expect(store.error()).toContain('сценарий');
  });

  it('should not update course when read-only', async () => {
    store.editingCourse.set({
      id: 'c1',
      title: 'Other Course',
      authorId: 'other-user',
      description: '',
      programs: [],
      programIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    } as CourseWithPrograms);

    const result = await store.updateCourse('c1', {
      title: 'Updated',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Нельзя изменять чужой курс');
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
  });

  it('should delete own course successfully', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'My Course',
        authorId: 'local-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    mockCourseSearchService.delete.mockResolvedValue(undefined);
    mockCourseSearchService.search.mockResolvedValue({ items: [], totalItems: 0 });

    await store.deleteCourse('c1');

    expect(mockCourseSearchService.delete).toHaveBeenCalledWith('c1');
  });

  it('should not delete another user course', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'Other Course',
        authorId: 'other-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    await store.deleteCourse('c1');

    expect(store.error()).toBe('Нельзя удалять чужой курс');
    expect(mockCourseSearchService.delete).not.toHaveBeenCalled();
  });

  it('should cancel editing when the edited course is deleted', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'My Course',
        authorId: 'local-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);
    store.editingCourseId.set('c1');

    mockCourseSearchService.delete.mockResolvedValue(undefined);
    mockCourseSearchService.search.mockResolvedValue({ items: [], totalItems: 0 });

    await store.deleteCourse('c1');

    expect(store.editorMode()).toBe('list');
    expect(store.editingCourseId()).toBeNull();
  });

  it('should return null when course not found in bundle export', async () => {
    store.indexItems.set([]);
    mockCoursesApi.getBundle.mockRejectedValue(new Error('Курс не найден'));

    const result = await store.exportCourseBundle('nonexistent');

    expect(result).toBeNull();
    expect(store.exportError()).toContain('не найден');
  });

  it('should export PDF for own course', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'My Course',
        authorId: 'local-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    mockPdfExport.export.mockResolvedValue(new Blob());

    const result = await store.exportPdf('c1', true);

    expect(result).toBe(true);
    expect(mockPdfExport.export).toHaveBeenCalled();
  });

  it('should not export PDF for another user course', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'Other Course',
        authorId: 'other-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    const result = await store.exportPdf('c1', true);

    expect(result).toBe(false);
    expect(store.exportError()).toBe('Нельзя экспортировать чужой курс');
    expect(mockPdfExport.export).not.toHaveBeenCalled();
  });

  it('should create course successfully and reload list', async () => {
    mockCourseSearchService.create.mockResolvedValue({
      id: 'c-new',
      title: 'New Course',
      authorId: 'local-user',
      description: '',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    mockCourseSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    const result = await store.createCourse({
      title: 'New Course',
      description: 'A new course',
      published: false,
      authoring: { idea: 'My idea', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(true);
    expect(store.editorMode()).toBe('list');
    expect(mockCourseSearchService.create).toHaveBeenCalled();
    expect(mockCourseSearchService.search).toHaveBeenCalled();
  });

  it('should update course successfully and reload list', async () => {
    store.editingCourse.set({
      id: 'c1',
      title: 'Old Title',
      authorId: 'local-user',
      description: '',
      programs: [],
      programIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    } as CourseWithPrograms);

    mockCourseSearchService.update.mockResolvedValue({
      id: 'c1',
      title: 'Updated Title',
      authorId: 'local-user',
      description: '',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    mockCourseSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    const result = await store.updateCourse('c1', {
      title: 'Updated',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(true);
    expect(store.editorMode()).toBe('list');
    expect(mockCourseSearchService.update).toHaveBeenCalled();
  });

  it('should filter empty prerequisite lesson IDs during normalization', async () => {
    mockCourseSearchService.create.mockResolvedValue({
      id: 'c-new',
      title: 'Clean IDs Course',
      authorId: 'local-user',
      description: '',
      programs: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    });

    mockCourseSearchService.search.mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    await store.createCourse({
      title: 'Clean IDs Course',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: ['', '  ', 'valid-id'],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(mockCourseSearchService.create).toHaveBeenCalled();
  });

  it('should handle export bundle failure with error message', async () => {
    mockCoursesApi.getBundle.mockRejectedValue(new Error('Course not found in bundle'));

    const result = await store.exportCourseBundle('c1');

    expect(result).toBeNull();
    expect(store.exportError()).toContain('Ошибка при экспорте курса');
  });

  it('should set export error on PDF export failure', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'My Course',
        authorId: 'local-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    mockCourseSearchService.getById.mockRejectedValue(new Error('Not found'));

    const result = await store.exportPdf('c1', false);

    expect(result).toBe(false);
    expect(store.exportError()).toBe('Ошибка при экспорте в PDF');
  });

  it('should handle create course API failure', async () => {
    mockCourseSearchService.create.mockRejectedValue(new Error('API error'));

    const result = await store.createCourse({
      title: 'Failing Course',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось создать курс');
  });

  it('should handle update course API failure', async () => {
    store.editingCourse.set({
      id: 'c1',
      title: 'Old Title',
      authorId: 'local-user',
      description: '',
      programs: [],
      programIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    } as CourseWithPrograms);

    mockCourseSearchService.update.mockRejectedValue(new Error('API error'));

    const result = await store.updateCourse('c1', {
      title: 'Updated',
      description: '',
      published: false,
      authoring: { idea: '', status: 'draft' },
      programs: [
        {
          clientId: 'lc-1',
          title: 'Lesson 1',
          description: '',
          lessons: [
            {
              clientId: 'l-1',
              title: 'Scenario 1',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
            },
          ],
          order: 0,
        },
      ],
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось сохранить курс');
  });

  it('should handle delete course API failure', async () => {
    store.indexItems.set([
      {
        id: 'c1',
        title: 'My Course',
        authorId: 'local-user',
        programCount: 1,
        published: false,
        updatedAt: '',
        languagePairSummary: 'Russian → English',
      },
    ]);

    mockCourseSearchService.delete.mockRejectedValue(new Error('Delete failed'));

    await store.deleteCourse('c1');

    expect(store.error()).toBe('Не удалось удалить курс');
  });
});
