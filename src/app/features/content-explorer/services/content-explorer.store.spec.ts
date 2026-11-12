import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthStore } from '../../../entities/auth/services/auth.store';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../../../entities/course/model';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
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
} as unknown as CardIndexEntry;

function setup(overrides?: {
  scenarioById?: (id: string) => Scenario | undefined;
}): ContentExplorerStore {
  const scenarioById =
    overrides?.scenarioById ??
    ((id: string) => (id === 'scenario-1' ? scenario : undefined));

  const courseSearchService = {
    search: vi.fn().mockResolvedValue({ items: [courseEntry], totalItems: 1 }),
    getById: vi.fn().mockResolvedValue(course),
    clearGetByIdCache: vi.fn(),
  };

  const programsApi = {
    getById: vi.fn().mockResolvedValue(program),
  };

  const scenarioSearchService = {
    getByIdBatch: vi.fn().mockImplementation((ids: readonly string[]) =>
      Promise.resolve(ids.map(scenarioById).filter((s): s is Scenario => Boolean(s))),
    ),
  };

  const cardSearchService = {
    ensureIndexLoaded: vi.fn().mockResolvedValue(undefined),
    indexEntries: vi.fn().mockReturnValue([cardEntry]),
    getCardById: vi.fn(),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: CourseSearchService, useValue: courseSearchService },
      { provide: ProgramsApiService, useValue: programsApi },
      { provide: ScenarioSearchService, useValue: scenarioSearchService },
      { provide: CardSearchService, useValue: cardSearchService },
      {
        provide: AuthStore,
        useValue: {
          user: vi.fn(() => ({ id: TEST_USER_ID, displayName: '', email: '', roles: ['ROLE_AUTHOR'] })),
        },
      },
      { provide: AppLoggerService, useValue: { error: vi.fn(), warn: vi.fn() } },
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

    expect(courseNode.title()).toBe('Английский A1 (обновлён)');
    expect(courseNode.expanded()).toBe(true);
    expect(courseNode.children()).toHaveLength(1);
  });
});
