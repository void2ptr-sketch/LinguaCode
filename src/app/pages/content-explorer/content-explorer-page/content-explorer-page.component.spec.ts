import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import {
  ContentExplorerStore,
  ExplorerNode,
} from '../../../features/content-explorer/services/content-explorer.store';
import { CourseBuilderDialogService } from '../../../features/course-builder/components/course-builder-dialog/course-builder-dialog.service';
import { CourseBuilderStore } from '../../../features/course-builder/services/course-builder.store';
import { ScenarioBuilderDialogService } from '../../../features/scenario-builder/components/scenario-builder-dialog/scenario-builder-dialog.service';
import { CardEditorDialogService } from '../../../features/card-editor/components/card-editor-dialog/card-editor-dialog.service';
import { ProgramBuilderDialogService } from '../../../features/program-builder/components/program-builder-dialog/program-builder-dialog.service';
import { LessonBuilderDialogService } from '../../../features/lesson-builder/components/lesson-builder-dialog/lesson-builder-dialog.service';
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import { ScenarioBuilderStore } from '../../../features/scenario-builder/services/scenario-builder.store';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import { ScormExportService } from '../../../entities/course/api/scorm-export.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { CourseWithPrograms } from '../../../entities/course/model';

import { ContentExplorerPageComponent } from './content-explorer-page.component';

/**
 * Спецификация привязки сценария к уроку (Этап 1 миграции):
 * `onAddScenarioRequested` после успешного сохранения в диалоге
 * привязывает созданный сценарий к выбранному уроку (PUT курса целиком),
 * включая путь обработки ошибки привязки.
 */
describe('ContentExplorerPageComponent — onAddScenarioRequested (scenario binding)', () => {
  let component: ContentExplorerPageComponent;
  let fixture: ComponentFixture<ContentExplorerPageComponent>;

  const mockStore = {
    selectedNode: vi.fn<() => ExplorerNode | null>(() => null),
    pathOf: vi.fn<() => readonly ExplorerNode[]>(() => []),
    refreshNode: vi.fn(async () => undefined),
    selectNode: vi.fn(),
    clearSelection: vi.fn(),
    loadRoots: vi.fn(async () => undefined),
    getByKey: vi.fn<() => ExplorerNode | null>(() => null),
  };

  const mockDialog = {
    open: vi.fn(() => ({
      afterClosed: () => of(true as boolean),
    })),
  };

  const mockScenarioBuilderStore = {
    deleteScenario: vi.fn(async () => undefined),
    error: vi.fn<() => string | null>(() => null),
  };

  const mockScenarioBuilderDialog = {
    openCreate: vi.fn(),
    openEdit: vi.fn(),
  };

  const mockCourseSearchService = {
    getById: vi.fn(),
    update: vi.fn(),
    clearGetByIdCache: vi.fn(),
  };

  const mockScenarioSearchService = {
    findUsingCard: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const courseNode = new ExplorerNode({
    kind: 'course',
    id: 'course-1',
    parentId: null,
    title: 'Course',
    editable: true,
  });
  const programNode = new ExplorerNode({
    kind: 'program',
    id: 'p1',
    parentId: 'course:course-1',
    title: 'Program 1',
    editable: true,
  });
  let lessonNode: ExplorerNode;

  function createCourse(): CourseWithPrograms {
    return {
      id: 'course-1',
      title: 'Course',
      description: 'Desc',
      authorId: 'author-1',
      languagePair: { known: 'ru', learning: 'en' },
      programIds: ['p1'],
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      programs: [
        {
          id: 'p1',
          courseId: 'course-1',
          title: 'Program 1',
          description: '',
          lessonIds: ['l2'],
          order: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
          lessons: [
            {
              id: 'l2',
              programId: 'p1',
              title: 'Lesson 2',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
    } as CourseWithPrograms;
  }

  function selectEditableLessonNode(): void {
    lessonNode = new ExplorerNode({
      kind: 'lesson',
      id: 'l2',
      parentId: 'program:p1',
      title: 'Lesson 2',
      meta: 'Урок · 1 сценарий(ев)',
      editable: true,
      data: { id: 'l2', programId: 'p1' },
    });
    lessonNode.children.set([]);
    mockStore.selectedNode.mockReturnValue(lessonNode);
    mockStore.pathOf.mockReturnValue([courseNode, programNode, lessonNode]);
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ContentExplorerPageComponent],
      providers: [
        { provide: ContentExplorerStore, useValue: mockStore },
        { provide: ScenarioBuilderDialogService, useValue: mockScenarioBuilderDialog },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: ScenarioSearchService, useValue: mockScenarioSearchService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AppLoggerService, useValue: { error: vi.fn() } },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ScenarioBuilderStore, useValue: mockScenarioBuilderStore },
        { provide: CourseBuilderDialogService, useValue: {} },
        { provide: CourseBuilderStore, useValue: {} },
        { provide: CardEditorDialogService, useValue: {} },
        { provide: ProgramBuilderDialogService, useValue: {} },
        { provide: LessonBuilderDialogService, useValue: {} },
        { provide: ScormExportService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentExplorerPageComponent);
    component = fixture.componentInstance;
    mockCourseSearchService.getById.mockResolvedValue(createCourse());
    mockCourseSearchService.update.mockResolvedValue(createCourse());
  });

  it('binds the created scenario to the lesson and refreshes the tree', async () => {
    selectEditableLessonNode();
    const scenarioNode = new ExplorerNode({
      kind: 'scenario',
      id: 's-new',
      parentId: 'lesson:l2',
      title: 'New Scenario',
    });
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: true, scenarioId: 's-new' });
    mockStore.refreshNode.mockImplementation(async () => {
      lessonNode.children.set([scenarioNode]);
    });

    await component['onAddScenarioRequested']();

    expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-1');
    expect(mockCourseSearchService.update).toHaveBeenCalledTimes(1);
    const [courseId, payload] = mockCourseSearchService.update.mock.calls[0] as [
      string,
      {
        programs: readonly {
          lessons?: readonly { id?: string; scenarioIds: readonly string[] }[];
        }[];
      },
    ];
    expect(courseId).toBe('course-1');
    const lesson = payload.programs
      .flatMap((program) => program.lessons ?? [])
      .find((item) => item.id === 'l2');
    expect(lesson?.scenarioIds).toEqual(['s1', 's-new']);

    expect(mockCourseSearchService.clearGetByIdCache).toHaveBeenCalled();
    expect(mockStore.refreshNode).toHaveBeenCalledWith(lessonNode);
    expect(mockStore.selectNode).toHaveBeenCalledWith(scenarioNode);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий создан и добавлен в урок', undefined, {
      duration: 5000,
    });
  });

  it('shows a non-blocking error and does not refresh on binding failure', async () => {
    selectEditableLessonNode();
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: true, scenarioId: 's-new' });
    mockCourseSearchService.update.mockRejectedValue(new Error('Conflict'));

    await component['onAddScenarioRequested']();

    // Сценарий уже создан — откат не выполняется, дерево не обновляется.
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockStore.selectNode).not.toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Сценарий создан, но не удалось привязать его к уроку — добавьте его в конструкторе курсов',
      'Закрыть',
      { duration: 8000 },
    );
  });

  it('does not touch the course on dialog cancel', async () => {
    selectEditableLessonNode();
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: false });

    await component['onAddScenarioRequested']();

    expect(mockCourseSearchService.getById).not.toHaveBeenCalled();
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Создание сценария отменено', undefined, {
      duration: 5000,
    });
  });

  it('creates the scenario without binding when no lesson is selected', async () => {
    mockStore.selectedNode.mockReturnValue(null);
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: true, scenarioId: 's-new' });

    await component['onAddScenarioRequested']();

    expect(mockCourseSearchService.getById).not.toHaveBeenCalled();
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий создан', undefined, {
      duration: 5000,
    });
  });

  it('does not bind when the selected lesson is not editable', async () => {
    const readOnlyLesson = new ExplorerNode({
      kind: 'lesson',
      id: 'l2',
      parentId: 'program:p1',
      title: 'Lesson 2',
      editable: false,
    });
    readOnlyLesson.children.set([]);
    mockStore.selectedNode.mockReturnValue(readOnlyLesson);
    mockStore.pathOf.mockReturnValue([courseNode, programNode, readOnlyLesson]);
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: true, scenarioId: 's-new' });

    await component['onAddScenarioRequested']();

    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий создан', undefined, {
      duration: 5000,
    });
  });
});

/**
 * Спецификация удаления сценария (Этап 2 миграции):
 * `onDeleteScenarioRequested` требует подтверждения, делегирует удаление
 * в `ScenarioBuilderStore` (с entry из данных узла), каскадно убирает
 * id сценария из `lesson.scenarioIds` и обновляет узел урока в дереве.
 */
describe('ContentExplorerPageComponent — onDeleteScenarioRequested (scenario deletion)', () => {
  let component: ContentExplorerPageComponent;
  let fixture: ComponentFixture<ContentExplorerPageComponent>;

  const mockStore = {
    selectedNode: vi.fn<() => ExplorerNode | null>(() => null),
    pathOf: vi.fn<() => readonly ExplorerNode[]>(() => []),
    refreshNode: vi.fn(async () => undefined),
    selectNode: vi.fn(),
    clearSelection: vi.fn(),
    loadRoots: vi.fn(async () => undefined),
    getByKey: vi.fn<() => ExplorerNode | null>(() => null),
  };

  const mockScenarioBuilderStore = {
    deleteScenario: vi.fn(async () => undefined),
    error: vi.fn<() => string | null>(() => null),
  };

  const mockCourseSearchService = {
    getById: vi.fn(),
    update: vi.fn(),
    clearGetByIdCache: vi.fn(),
  };

  const mockScenarioSearchService = {
    findUsingCard: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockDialog = {
    open: vi.fn(() => ({
      afterClosed: () => of(true as boolean),
    })),
  };

  const courseNode = new ExplorerNode({
    kind: 'course',
    id: 'course-1',
    parentId: null,
    title: 'Course',
    editable: true,
  });
  const programNode = new ExplorerNode({
    kind: 'program',
    id: 'p1',
    parentId: 'course:course-1',
    title: 'Program 1',
    editable: true,
  });
  let lessonNode: ExplorerNode;
  let scenarioNode: ExplorerNode;

  function createCourse(): CourseWithPrograms {
    return {
      id: 'course-1',
      title: 'Course',
      description: 'Desc',
      authorId: 'author-1',
      languagePair: { known: 'ru', learning: 'en' },
      programIds: ['p1'],
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      programs: [
        {
          id: 'p1',
          courseId: 'course-1',
          title: 'Program 1',
          description: '',
          lessonIds: ['l2'],
          order: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
          lessons: [
            {
              id: 'l2',
              programId: 'p1',
              title: 'Lesson 2',
              description: '',
              scenarioIds: ['s1'],
              prerequisiteLessonIds: [],
              order: 0,
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
    } as CourseWithPrograms;
  }

  function selectOwnScenarioNode(): void {
    lessonNode = new ExplorerNode({
      kind: 'lesson',
      id: 'l2',
      parentId: 'program:p1',
      title: 'Lesson 2',
      meta: 'Урок · 1 сценарий(ев)',
      editable: true,
      data: { id: 'l2', programId: 'p1', scenarioIds: ['s1'] },
    });
    scenarioNode = new ExplorerNode({
      kind: 'scenario',
      id: 's1',
      parentId: 'lesson:l2',
      title: 'Мой сценарий',
      editable: true,
      data: {
        id: 's1',
        title: 'Мой сценарий',
        authorId: 'user-1',
        cardSource: { mode: 'fixed', cardIds: [] },
        published: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    mockStore.selectedNode.mockReturnValue(scenarioNode);
    mockStore.getByKey.mockReturnValue(lessonNode);
    mockStore.pathOf.mockReturnValue([courseNode, programNode, lessonNode]);
  }

  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  function confirmDialog(confirmed: boolean): void {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(confirmed as boolean),
    });
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ContentExplorerPageComponent],
      providers: [
        { provide: ContentExplorerStore, useValue: mockStore },
        {
          provide: ScenarioBuilderDialogService,
          useValue: { openCreate: vi.fn(), openEdit: vi.fn() },
        },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: ScenarioSearchService, useValue: mockScenarioSearchService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AppLoggerService, useValue: { error: vi.fn() } },
        { provide: ScenarioBuilderStore, useValue: mockScenarioBuilderStore },
        { provide: CourseBuilderDialogService, useValue: {} },
        { provide: CourseBuilderStore, useValue: {} },
        { provide: CardEditorDialogService, useValue: {} },
        { provide: ProgramBuilderDialogService, useValue: {} },
        { provide: LessonBuilderDialogService, useValue: {} },
        { provide: ScormExportService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(ContentExplorerPageComponent);
    component = fixture.componentInstance;
    mockCourseSearchService.getById.mockResolvedValue(createCourse());
    mockCourseSearchService.update.mockResolvedValue(createCourse());
    mockScenarioBuilderStore.error.mockReturnValue(null);
    dialogOpenSpy = vi.mocked(mockDialog.open);
    confirmDialog(true);
  });

  it('deletes the scenario after confirmation, cascades unbind and refreshes the lesson node', async () => {
    selectOwnScenarioNode();

    await component['onDeleteScenarioRequested']();

    // confirm-диалог открыт с заголовком сценария
    const [dialogComponent, dialogConfig] = dialogOpenSpy.mock.calls[0] as unknown as [
      unknown,
      { data: { scenarioTitle: string } },
    ];
    expect(dialogComponent).toBeDefined();
    expect(dialogConfig.data.scenarioTitle).toBe('Мой сценарий');

    // удаление делегировано в store с entry из данных узла (authorId)
    expect(mockScenarioBuilderStore.deleteScenario).toHaveBeenCalledTimes(1);
    const [scenarioId, entry] = mockScenarioBuilderStore.deleteScenario.mock
      .calls[0] as unknown as [string, { id: string; authorId: string } | undefined];
    expect(scenarioId).toBe('s1');
    expect(entry?.authorId).toBe('user-1');

    // каскад: сценарий убран из lesson.scenarioIds через PUT курса
    expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-1');
    expect(mockCourseSearchService.update).toHaveBeenCalledTimes(1);
    const [courseId, payload] = mockCourseSearchService.update.mock.calls[0] as [
      string,
      {
        programs: readonly {
          lessons?: readonly { id?: string; scenarioIds: readonly string[] }[];
        }[];
      },
    ];
    expect(courseId).toBe('course-1');
    const lesson = payload.programs
      .flatMap((program) => program.lessons ?? [])
      .find((item) => item.id === 'l2');
    expect(lesson?.scenarioIds).toEqual([]);
    expect(mockCourseSearchService.clearGetByIdCache).toHaveBeenCalled();

    expect(mockStore.refreshNode).toHaveBeenCalledWith(lessonNode);
    expect(mockStore.clearSelection).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий удалён', 'Закрыть', {
      duration: 4000,
    });
  }, 20000);

  it('does not delete anything when the confirm dialog is cancelled', async () => {
    selectOwnScenarioNode();
    confirmDialog(false);

    await component['onDeleteScenarioRequested']();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(mockScenarioBuilderStore.deleteScenario).not.toHaveBeenCalled();
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockStore.clearSelection).not.toHaveBeenCalled();
  }, 20000);

  it('shows an error snackbar and does not refresh when the store reports a failure', async () => {
    selectOwnScenarioNode();
    mockScenarioBuilderStore.error.mockReturnValue('Не удалось удалить сценарий');

    await component['onDeleteScenarioRequested']();

    expect(mockScenarioBuilderStore.deleteScenario).toHaveBeenCalledWith('s1', expect.anything());
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockStore.clearSelection).not.toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Не удалось удалить сценарий', 'Закрыть', {
      duration: 8000,
    });
  }, 20000);

  it('skips the course PUT when the lesson no longer references the scenario (backend cascade)', async () => {
    selectOwnScenarioNode();
    const cascadedCourse = createCourse();
    (cascadedCourse.programs[0].lessons?.[0] as unknown as { scenarioIds: string[] }).scenarioIds =
      [];

    mockCourseSearchService.getById.mockResolvedValue(cascadedCourse);

    await component['onDeleteScenarioRequested']();

    expect(mockScenarioBuilderStore.deleteScenario).toHaveBeenCalled();
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).toHaveBeenCalledWith(lessonNode);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий удалён', 'Закрыть', {
      duration: 4000,
    });
  }, 20000);

  it('does not open the confirm dialog for a foreign (read-only) scenario', async () => {
    const foreignScenario = new ExplorerNode({
      kind: 'scenario',
      id: 's1',
      parentId: 'lesson:l2',
      title: 'Чужой сценарий',
      editable: false,
      data: {},
    });
    mockStore.selectedNode.mockReturnValue(foreignScenario);

    await component['onDeleteScenarioRequested']();

    expect(dialogOpenSpy).not.toHaveBeenCalled();
    expect(mockScenarioBuilderStore.deleteScenario).not.toHaveBeenCalled();
  });
});

/**
 * Спецификация «Каталога сценариев» (Этап 4 миграции): inline-панель
 * в Проводнике переиспользует состояние списка `ScenarioBuilderStore`
 * (scope / пагинация) и общий диалог сценария — без дублирования
 * состояния в store Проводника и без привязки к уроку.
 */
describe('ContentExplorerPageComponent — scenario catalog (stage 4)', () => {
  let component: ContentExplorerPageComponent;
  let fixture: ComponentFixture<ContentExplorerPageComponent>;

  const mockStore = {
    selectedNode: vi.fn<() => ExplorerNode | null>(() => null),
    pathOf: vi.fn<() => readonly ExplorerNode[]>(() => []),
    refreshNode: vi.fn(async () => undefined),
    selectNode: vi.fn(),
    clearSelection: vi.fn(),
    loadRoots: vi.fn(async () => undefined),
    getByKey: vi.fn<() => ExplorerNode | null>(() => null),
  };

  const mockScenarioBuilderStore = {
    // Сигналы, читаемые шаблоном каталога (на текущую страницу списка).
    indexItems: vi.fn<() => readonly unknown[] | null>(() => null),
    totalItems: vi.fn(() => 0),
    pageIndex: vi.fn(() => 0),
    pageSize: vi.fn(() => 10),
    listScope: vi.fn(() => 'mine'),
    loading: vi.fn(() => false),
    error: vi.fn<() => string | null>(() => null),
    // Методы списка.
    loadList: vi.fn(async () => undefined),
    setListScope: vi.fn(),
    setPage: vi.fn(),
    deleteScenario: vi.fn(async () => undefined),
  };

  const mockScenarioBuilderDialog = {
    openCreate: vi.fn(),
    openEdit: vi.fn(),
  };

  const mockCourseSearchService = {
    getById: vi.fn(),
    update: vi.fn(),
    clearGetByIdCache: vi.fn(),
  };

  const mockScenarioSearchService = {
    findUsingCard: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockDialog = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ContentExplorerPageComponent],
      providers: [
        { provide: ContentExplorerStore, useValue: mockStore },
        { provide: ScenarioBuilderDialogService, useValue: mockScenarioBuilderDialog },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: ScenarioSearchService, useValue: mockScenarioSearchService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AppLoggerService, useValue: { error: vi.fn() } },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ScenarioBuilderStore, useValue: mockScenarioBuilderStore },
        { provide: CourseBuilderDialogService, useValue: {} },
        { provide: CourseBuilderStore, useValue: {} },
        { provide: CardEditorDialogService, useValue: {} },
        { provide: ProgramBuilderDialogService, useValue: {} },
        { provide: LessonBuilderDialogService, useValue: {} },
        { provide: ScormExportService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentExplorerPageComponent);
    component = fixture.componentInstance;
  });

  it('reloads the list when the catalog opens, but not when it closes', async () => {
    await component['onToggleCatalog']();
    expect(component['catalogOpen']()).toBe(true);
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);

    await component['onToggleCatalog']();
    expect(component['catalogOpen']()).toBe(false);
    // Закрытие не перезагружает список.
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);
  });

  it('delegates scope change to the store and reloads the list (store resets to page 0)', async () => {
    await component['onCatalogScopeChange']({ value: 'published' } as never);

    expect(mockScenarioBuilderStore.setListScope).toHaveBeenCalledWith('published');
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);
  });

  it('delegates pagination to the store and reloads the list', async () => {
    const pageEvent = { pageIndex: 2, pageSize: 25, length: 100, previousPageIndex: 1 } as never;

    await component['onCatalogPageChange'](pageEvent);

    expect(mockScenarioBuilderStore.setPage).toHaveBeenCalledWith(2, 25);
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);
  });

  it('creates a scenario without lesson binding and reloads the catalog list on save', async () => {
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: true, scenarioId: 's-new' });

    await component['onCatalogCreateRequested']();

    expect(mockScenarioBuilderDialog.openCreate).toHaveBeenCalledWith();
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Сценарий создан', undefined, {
      duration: 5000,
    });
    // Создание из каталога — без привязки к уроку (план, Этап 4).
    expect(mockCourseSearchService.getById).not.toHaveBeenCalled();
    expect(mockCourseSearchService.update).not.toHaveBeenCalled();
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
  });

  it('does not reload the catalog list when create is cancelled', async () => {
    mockScenarioBuilderDialog.openCreate.mockResolvedValue({ saved: false });

    await component['onCatalogCreateRequested']();

    expect(mockScenarioBuilderStore.loadList).not.toHaveBeenCalled();
    expect(mockSnackBar.open).not.toHaveBeenCalled();
  });

  it('edits a scenario via the shared dialog and reloads the list without touching the tree', async () => {
    mockScenarioBuilderDialog.openEdit.mockResolvedValue({ saved: true, scenarioId: 's1' });

    await component['onCatalogEditRequested']('s1');

    expect(mockScenarioBuilderDialog.openEdit).toHaveBeenCalledWith('s1');
    expect(mockScenarioBuilderStore.loadList).toHaveBeenCalledTimes(1);
    // Автономные сценарии в дереве не живут — дерево не обновляется.
    expect(mockStore.refreshNode).not.toHaveBeenCalled();
    expect(mockStore.selectNode).not.toHaveBeenCalled();
  });

  it('returns catalog items safely when the store list is not loaded', () => {
    mockScenarioBuilderStore.indexItems.mockReturnValue(null);

    expect(component['catalogItems']()).toEqual([]);
  });
});
