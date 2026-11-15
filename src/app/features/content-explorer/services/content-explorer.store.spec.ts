import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthStore } from '../../../entities/auth/services/auth.store';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../../../entities/course/model';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import { LessonsApiService } from '../../../entities/lesson/api/lessons-api.service';
import type { ProgramWithLessons } from '../../../entities/program/model/program.types';
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import type { Scenario } from '../../../entities/scenario/model';
import { CardSearchService } from '../../../entities/card/search/card-search.service';
import type { CardIndexEntry } from '../../../entities/card/model/card-index.types';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

import { ContentExplorerStore, ExplorerNode } from './content-explorer.store';

const TEST_USER_ID = 'author-1';

const courseEntry: CourseIndexEntry = {
  id: 'course-1',
  title: 'Английский A1',
  authorId: TEST_USER_ID,
  programCount: 1,
  published: true,
  updatedAt: '2026-01-01T00:00:00Z',
  languagePairSummary: 'ru→en',
  knownLanguage: 'ru',
  learningLanguage: 'en',
};

const program: ProgramWithLessons = {
  id: 'program-1',
  courseId: 'course-1',
  title: 'Basics',
  description: '',
  lessonIds: ['lesson-1'],
  order: 0,
  updatedAt: '2026-01-01T00:00:00Z',
  lessons: [
    {
      id: 'lesson-1',
      programId: 'program-1',
      title: 'Приветствия',
      description: '',
      scenarioIds: ['scenario-1'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
};

const course: CourseWithPrograms = {
  ...courseEntry,
  description: '',
  languagePair: { known: 'ru', learning: 'en' },
  programIds: ['program-1'],
  programs: [program],
} as unknown as CourseWithPrograms;

const scenario: Scenario = {
  id: 'scenario-1',
  title: 'Демо: приветствие',
  description: '',
  authorId: TEST_USER_ID,
  cardSource: { mode: 'fixed', cardIds: ['card-1', 'card-2'] },
  published: true,
  updatedAt: '2026-01-01T00:00:00Z',
};

const criteriaScenario: Scenario = {
  ...scenario,
  id: 'scenario-1',
  title: 'Набор по критериям',
  cardSource: { mode: 'criteria', criteria: {} as never, limit: 5 },
};

const cardEntry: CardIndexEntry = {
  id: 'card-1',
  kind: 'select',
  title: 'Hello',
  knownLanguage: 'en',
  learningLanguage: 'ru',
  difficulty: 'beginner',
  tags: [],
  ipaReadings: [],
  updatedAt: '2026-01-01T00:00:00Z',
  courseId: 'course-1',
  lessonId: 'lesson-1',
  scenarioId: 'scenario-1',
} as unknown as CardIndexEntry;

function setup(overrides?: {
  scenarioById?: (id: string) => Scenario | undefined;
}): ContentExplorerStore {
  const scenarioById =
    overrides?.scenarioById ?? ((id: string) => (id === 'scenario-1' ? scenario : undefined));

  const courseSearchService = {
    // `loadRoots()` has no query; catalog searches are opt-in per test.
    search: vi
      .fn()
      .mockImplementation((criteria: { query?: string }) =>
        Promise.resolve(
          criteria.query ? { items: [], totalItems: 0 } : { items: [courseEntry], totalItems: 1 },
        ),
      ),
    getById: vi.fn().mockResolvedValue(course),
    clearGetByIdCache: vi.fn(),
  };

  const programsApi = {
    getById: vi.fn().mockResolvedValue(program),
    search: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getByCourse: vi.fn().mockResolvedValue([program]),
  };

  const lessonsApi = {
    getById: vi.fn().mockResolvedValue(program.lessons![0]),
    getByProgramId: vi.fn().mockResolvedValue(program.lessons!),
  };

  const scenarioSearchService = {
    search: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getByIdBatch: vi
      .fn()
      .mockImplementation((ids: readonly string[]) =>
        Promise.resolve(ids.map(scenarioById).filter((s): s is Scenario => Boolean(s))),
      ),
  };

  const cardSearchService = {
    search: vi.fn().mockResolvedValue({
      items: [cardEntry],
      page: 0,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1,
      facets: {
        knownLanguages: [],
        learningLanguages: [],
        difficulties: [],
        kinds: [],
        tags: [],
      },
    }),
    ensureIndexLoaded: vi.fn().mockResolvedValue(undefined),
    indexEntries: vi.fn().mockReturnValue([cardEntry]),
    getCardById: vi.fn(),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: CourseSearchService, useValue: courseSearchService },
      { provide: ProgramsApiService, useValue: programsApi },
      { provide: LessonsApiService, useValue: lessonsApi },
      { provide: ScenarioSearchService, useValue: scenarioSearchService },
      { provide: CardSearchService, useValue: cardSearchService },
      {
        provide: AuthStore,
        useValue: {
          user: vi.fn(() => ({
            id: TEST_USER_ID,
            displayName: '',
            email: '',
            roles: ['ROLE_AUTHOR'],
          })),
        },
      },
      {
        provide: AppLoggerService,
        useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      },
    ],
  });

  return TestBed.inject(ContentExplorerStore);
}

describe('ContentExplorerStore', () => {
  let store: ContentExplorerStore;

  beforeEach(() => {
    store = setup();
  });

  it('loads course roots with meta and author editability', async () => {
    await store.loadRoots();

    expect(store.roots()).toHaveLength(1);
    const root = store.roots()[0];
    expect(root.kind).toBe('course');
    expect(root.title()).toBe('Английский A1');
    expect(root.meta()).toContain('опубликован');
    expect(root.editable).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('clearSelection resets selectedId and selectedNode (used after course deletion)', async () => {
    await store.loadRoots();
    store.selectNode(store.roots()[0]);
    expect(store.selectedNode()).not.toBeNull();

    store.clearSelection();

    expect(store.selectedId()).toBeNull();
    expect(store.selectedNode()).toBeNull();
  });

  it('lazily loads course → program → lesson → scenario → card chain', async () => {
    await store.loadRoots();
    const courseNode = store.roots()[0];

    await store.toggleNode(courseNode);
    expect(courseNode.expanded()).toBe(true);
    expect(courseNode.children()).toHaveLength(1);

    const programNode = courseNode.children()![0];
    expect(programNode.kind).toBe('program');
    expect(programNode.title()).toBe('Basics');

    await store.toggleNode(programNode);
    const lessonNode = programNode.children()![0];
    expect(lessonNode.kind).toBe('lesson');
    expect(lessonNode.title()).toBe('Приветствия');

    await store.toggleNode(lessonNode);
    const scenarioNode = lessonNode.children()![0];
    expect(scenarioNode.kind).toBe('scenario');
    expect(scenarioNode.title()).toBe('Демо: приветствие');

    await store.toggleNode(scenarioNode);
    const cardNodes = scenarioNode.children()!;
    expect(cardNodes.map((node) => node.id)).toEqual(['card-1', 'card-2']);
    expect(cardNodes[0].shared).toBe(true);
    expect(cardNodes[0].title()).toBe('Hello');
  });

  it('renders a virtual criteria node for criteria card sources', async () => {
    store = setup({ scenarioById: (id) => (id === 'scenario-1' ? criteriaScenario : undefined) });
    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);

    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);
    const lessonNode = programNode.children()![0];
    await store.toggleNode(lessonNode);
    const scenarioNode = lessonNode.children()![0];
    await store.toggleNode(scenarioNode);

    const children = scenarioNode.children()!;
    expect(children).toHaveLength(1);
    expect(children[0].virtual).toBe(true);
    expect(children[0].title()).toContain('критериям');
    expect(children[0].meta()).toContain('5');
  });

  it('builds the ancestor path for a nested node', async () => {
    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);
    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);
    const lessonNode = programNode.children()![0];

    const path = store.pathOf(lessonNode);
    expect(path.map((node) => node.kind)).toEqual(['course', 'program', 'lesson']);
    expect(store.parentCourseOf(lessonNode)?.id).toBe('course-1');
  });

  it('reveal() resolves a deep-link chain and selects the deepest node', async () => {
    await store.loadRoots();

    const result = await store.reveal({
      courseId: 'course-1',
      programId: 'program-1',
      lessonId: 'lesson-1',
      scenarioId: 'scenario-1',
      cardId: 'card-1',
    });

    expect(result.found).toBe(true);
    expect(result.node?.id).toBe('card-1');
    expect(store.selectedId()).toBe('card-1');

    const card = store.selectedNode() as ExplorerNode;
    const path = store.pathOf(card);
    expect(path.map((node) => node.id)).toEqual([
      'course-1',
      'program-1',
      'lesson-1',
      'scenario-1',
      'card-1',
    ]);
  });

  it('reveal() reports not-found when the chain breaks', async () => {
    await store.loadRoots();
    const result = await store.reveal({ courseId: 'course-1', programId: 'missing' });
    expect(result.found).toBe(false);
    expect(store.selectedId()).toBeNull();
  });

  it('handles colliding numeric IDs across levels without infinite breadcrumb loops', async () => {
    // Реальная форма данных бэкенда: у всех сущностей числовые ID,
    // начинающиеся с 1 (course=1, program=1, lesson=1, scenario=1).
    const collidingProgram: ProgramWithLessons = {
      ...program,
      id: '1',
      lessons: [{ ...program.lessons[0], id: '1' }],
    };
    const collidingCourse: CourseWithPrograms = {
      ...course,
      id: '1',
      programs: [collidingProgram],
    } as unknown as CourseWithPrograms;
    const collidingScenario: Scenario = { ...scenario, id: '1' };
    const collidingCard: CardIndexEntry = { ...cardEntry, id: '1' } as unknown as CardIndexEntry;

    store = setup();
    const searchSpy = TestBed.inject(CourseSearchService) as unknown as {
      getById: ReturnType<typeof vi.fn>;
    };
    searchSpy.getById.mockResolvedValue(collidingCourse);
    vi.mocked(TestBed.inject(ProgramsApiService).getById).mockResolvedValue(collidingProgram);
    vi.mocked(TestBed.inject(ScenarioSearchService).getByIdBatch).mockResolvedValue([
      collidingScenario,
    ]);
    vi.mocked(TestBed.inject(CardSearchService).indexEntries).mockReturnValue([collidingCard]);

    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);
    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);
    const lessonNode = programNode.children()![0];
    await store.toggleNode(lessonNode);
    const scenarioNode = lessonNode.children()![0];

    // Раньше pathOf зацикливался: все уровни имеют id '1'.
    const path = store.pathOf(scenarioNode);
    expect(path.map((entry) => entry.kind)).toEqual(['course', 'program', 'lesson', 'scenario']);
    expect(store.parentCourseOf(scenarioNode)?.kind).toBe('course');
  });

  it('search() builds a filtered tree with card ancestors', async () => {
    await store.loadRoots();

    await store.search('Hello');

    const keys = store.searchVisibleKeys();
    expect(keys).not.toBeNull();
    expect([...keys!].sort()).toEqual(
      [
        'course:course-1',
        'program:program-1',
        'lesson:lesson-1',
        'scenario:scenario-1',
        'card:card-1',
      ].sort(),
    );

    expect(store.searchResultRoots().map((node) => node.key)).toEqual(['course:course-1']);

    const extraCards = store.searchExtraChildren().get('scenario:scenario-1') ?? [];
    expect(extraCards.map((node) => node.id)).toEqual(['card-1']);
    expect(store.pathOf(extraCards[0]).map((node) => node.kind)).toEqual([
      'course',
      'program',
      'lesson',
      'scenario',
      'card',
    ]);

    // The card itself matched; its ancestors form the context branch.
    expect(store.searchMatchedKeys().has('card:card-1')).toBe(true);
    expect(store.searchAncestorKeys().has('scenario:scenario-1')).toBe(true);
    expect(store.searchAncestorKeys().has('card:card-1')).toBe(false);
  });

  it('search() finds programs through /programs/search and attaches them to the course', async () => {
    await store.loadRoots();
    vi.mocked(TestBed.inject(CardSearchService).search).mockResolvedValue({
      items: [],
    } as never);
    vi.mocked(TestBed.inject(ProgramsApiService).search).mockResolvedValue({
      items: [
        {
          id: 'program-2',
          courseId: 'course-1',
          title: 'Advanced',
          order: 1,
          lessonCount: 1,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      totalItems: 1,
    } as never);

    await store.search('Advanced');

    expect(store.searchMatchedKeys().has('program:program-2')).toBe(true);
    const extras = store.searchExtraChildren().get('course:course-1') ?? [];
    expect(extras.map((node) => node.id)).toEqual(['program-2']);
    expect(store.searchVisibleKeys()?.has('course:course-1')).toBe(true);
    expect(store.searchResultRoots().map((node) => node.key)).toEqual(['course:course-1']);
    expect(store.pathOf(extras[0]).map((node) => node.kind)).toEqual(['course', 'program']);
  });

  it('search() finds scenarios through /scenarios/search and resolves the lesson chain', async () => {
    await store.loadRoots();
    vi.mocked(TestBed.inject(CardSearchService).search).mockResolvedValue({
      items: [],
    } as never);
    vi.mocked(TestBed.inject(ScenarioSearchService).search).mockResolvedValue({
      items: [
        {
          id: 'scenario-1',
          title: 'Демо: приветствие',
          authorId: TEST_USER_ID,
          cardSourceMode: 'fixed',
          cardSourceSummary: '2 карточки',
          published: true,
          updatedAt: '2026-01-01T00:00:00Z',
          courseId: 'course-1',
        },
      ],
      totalItems: 1,
    } as never);

    await store.search('Демо');

    expect(store.searchMatchedKeys().has('scenario:scenario-1')).toBe(true);
    const scenarioNode = store.getByKey('scenario:scenario-1');
    expect(scenarioNode).not.toBeNull();
    expect(store.pathOf(scenarioNode!).map((node) => node.kind)).toEqual([
      'course',
      'program',
      'lesson',
      'scenario',
    ]);
    expect(store.searchVisibleKeys()?.has('lesson:lesson-1')).toBe(true);
  });

  it('search() exposes scenarios without a lesson through a virtual root', async () => {
    await store.loadRoots();
    vi.mocked(TestBed.inject(CardSearchService).search).mockResolvedValue({
      items: [],
    } as never);
    vi.mocked(TestBed.inject(ScenarioSearchService).search).mockResolvedValue({
      items: [
        {
          id: 'scenario-orphan',
          title: 'Свободный сценарий',
          authorId: TEST_USER_ID,
          cardSourceMode: 'fixed',
          cardSourceSummary: '0 карточек',
          published: false,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      totalItems: 1,
    } as never);
    vi.mocked(TestBed.inject(ScenarioSearchService).getByIdBatch).mockResolvedValue([
      { ...scenario, id: 'scenario-orphan', title: 'Свободный сценарий' },
    ]);

    await store.search('Свободный');

    expect(store.searchMatchedKeys().has('scenario:scenario-orphan')).toBe(true);
    expect(store.searchResultRoots().map((node) => node.key)).toContain(
      'scenario:search:unattached-scenarios',
    );
    expect(store.searchVisibleKeys()?.has('scenario:search:unattached-scenarios')).toBe(true);
  });

  it('search() matches titles of already loaded nodes without card results', async () => {
    vi.mocked(TestBed.inject(CardSearchService).search).mockResolvedValue({
      items: [],
      page: 0,
      pageSize: 100,
      totalItems: 0,
      totalPages: 0,
      facets: {
        knownLanguages: [],
        learningLanguages: [],
        difficulties: [],
        kinds: [],
        tags: [],
      },
    } as never);

    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);
    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);

    await store.search('Приветствия');

    const keys = store.searchVisibleKeys();
    expect(keys?.has('lesson:lesson-1')).toBe(true);
    expect(keys?.has('program:program-1')).toBe(true);
    expect(keys?.has('course:course-1')).toBe(true);
    expect(store.searchExtraChildren().size).toBe(0);
    expect(store.searchResultRoots().map((node) => node.key)).toEqual(['course:course-1']);
  });

  it('clearSearch() removes the search overlay and search-only nodes', async () => {
    await store.search('Hello');
    expect(store.getByKey('card:card-1')).not.toBeNull();

    store.clearSearch();

    expect(store.searchVisibleKeys()).toBeNull();
    expect(store.searchMatchedKeys().size).toBe(0);
    expect(store.searchAncestorKeys().size).toBe(0);
    expect(store.searchExtraChildren().size).toBe(0);
    expect(store.searchResultRoots()).toHaveLength(0);
    expect(store.getByKey('card:card-1')).toBeNull();
  });

  it('selectNode() updates selection', async () => {
    await store.loadRoots();
    store.selectNode(store.roots()[0]);
    expect(store.selectedId()).toBe('course-1');
    expect(store.selectedNode()?.kind).toBe('course');
  });

  it('refreshNode() reloads a course node keeping expansion', async () => {
    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);

    const updatedCourse = {
      ...course,
      title: 'Английский A1 (обновлён)',
      programs: [program],
    };
    vi.mocked(TestBed.inject(CourseSearchService).getById).mockResolvedValue(updatedCourse);

    await store.refreshNode(courseNode);

    // Stale course snapshot must be dropped so a new program becomes visible.
    expect(TestBed.inject(CourseSearchService).clearGetByIdCache).toHaveBeenCalled();
    expect(courseNode.title()).toBe('Английский A1 (обновлён)');
    expect(courseNode.expanded()).toBe(true);
    expect(courseNode.children()).toHaveLength(1);
  });

  it('refreshNode() keeps lessons when GET /programs/:id returns an empty lessons array', async () => {
    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);
    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);

    expect(programNode.children()).toHaveLength(1);

    // Backend integration: `/programs/:id` omits lessons for an existing
    // program — the branch must not be wiped after refresh.
    vi.mocked(TestBed.inject(ProgramsApiService).getById).mockResolvedValue({
      ...program,
      lessons: [],
    });
    const newLesson = { ...program.lessons![0], id: 'lesson-2', title: 'Новый урок', order: 1 };
    vi.mocked(TestBed.inject(LessonsApiService).getByProgramId).mockResolvedValue([
      ...program.lessons!,
      newLesson,
    ]);

    await store.refreshNode(programNode);

    expect(programNode.children()!.map((node) => node.id)).toEqual(['lesson-1', 'lesson-2']);
    expect(TestBed.inject(LessonsApiService).getByProgramId).toHaveBeenCalledWith('program-1');
  });

  it('refreshNode() refetches a lesson so a newly bound scenario appears', async () => {
    await store.loadRoots();
    const courseNode = store.roots()[0];
    await store.toggleNode(courseNode);
    const programNode = courseNode.children()![0];
    await store.toggleNode(programNode);
    const lessonNode = programNode.children()![0];
    await store.toggleNode(lessonNode);

    expect(lessonNode.children()).toHaveLength(1);

    const newScenario: Scenario = { ...scenario, id: 'scenario-2', title: 'Новый сценарий' };
    const scenarioSearch = TestBed.inject(ScenarioSearchService);
    vi.mocked(scenarioSearch.getByIdBatch).mockImplementation((ids: readonly string[]) =>
      Promise.resolve(
        ids
          .map((id) =>
            id === 'scenario-2' ? newScenario : id === 'scenario-1' ? scenario : undefined,
          )
          .filter((value): value is Scenario => Boolean(value)),
      ),
    );
    vi.mocked(TestBed.inject(LessonsApiService).getById).mockResolvedValue({
      ...program.lessons![0],
      title: 'Приветствия (обновлён)',
      scenarioIds: ['scenario-1', 'scenario-2'],
    });

    await store.refreshNode(lessonNode);

    expect(lessonNode.title()).toBe('Приветствия (обновлён)');
    expect(lessonNode.meta()).toContain('2 сценарий');
    expect(lessonNode.children()!.map((node) => node.id)).toEqual(['scenario-1', 'scenario-2']);

    // Collapsing/expanding the program rebuilds lesson nodes from the parent
    // snapshot — it must carry the refreshed lesson, not the stale one.
    programNode.expanded.set(false);
    programNode.children.set(null);
    await store.toggleNode(programNode);

    expect(programNode.children()![0].title()).toBe('Приветствия (обновлён)');
  });
});
