import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthStore } from '../../../../entities/auth/services/auth.store';
import { CourseSearchService } from '../../../../entities/course/search/course-search.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../../../../entities/course/model';
import { ProgramsApiService } from '../../../../entities/program/api/programs-api.service';
import type { ProgramWithLessons } from '../../../../entities/program/model/program.types';
import { ScenarioSearchService } from '../../../../entities/scenario/search/scenario-search.service';
import type { Scenario } from '../../../../entities/scenario/model';
import { CardSearchService } from '../../../../entities/card/search/card-search.service';
import type { CardIndexEntry } from '../../../../entities/card/model/card-index.types';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

import { ContentExplorerStore } from '../../services/content-explorer.store';
import { ExplorerTreeComponent } from './explorer-tree.component';

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
  cardSource: { mode: 'fixed', cardIds: ['card-1'] },
  published: true,
  updatedAt: '2026-01-01T00:00:00Z',
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

describe('ExplorerTreeComponent (DOM rendering)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ExplorerTreeComponent],
      providers: [
        {
          provide: CourseSearchService,
          useValue: {
            // `loadRoots()` has no query; catalog searches are opt-in per test.
            search: vi
              .fn()
              .mockImplementation((criteria: { query?: string }) =>
                Promise.resolve(
                  criteria.query
                    ? { items: [], totalItems: 0 }
                    : { items: [courseEntry], totalItems: 1 },
                ),
              ),
            getById: vi.fn().mockResolvedValue(course),
            clearGetByIdCache: vi.fn(),
          },
        },
        {
          provide: ProgramsApiService,
          useValue: {
            getById: vi.fn().mockResolvedValue(program),
            search: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
            getByCourse: vi.fn().mockResolvedValue([program]),
          },
        },
        {
          provide: ScenarioSearchService,
          useValue: {
            search: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
            getByIdBatch: vi.fn().mockResolvedValue([scenario]),
            getByLessonId: vi.fn().mockResolvedValue([]),
            findUsingCard: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CardSearchService,
          useValue: {
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
          },
        },
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
  });

  it('renders the lazy chain course → program → lesson → scenario → card in the DOM', async () => {
    const store = TestBed.inject(ContentExplorerStore);
    const treeFixture = TestBed.createComponent(ExplorerTreeComponent);
    const el = treeFixture.nativeElement as HTMLElement;

    await store.loadRoots();
    treeFixture.detectChanges();
    expect(el.textContent).toContain('Английский A1');

    await store.toggleNode(store.roots()[0]);
    treeFixture.detectChanges();
    expect(el.textContent).toContain('Basics');

    const programNode = store.roots()[0].children()![0];
    await store.toggleNode(programNode);
    treeFixture.detectChanges();
    expect(el.textContent).toContain('Приветствия');

    const lessonNode = programNode.children()![0];
    await store.toggleNode(lessonNode);
    treeFixture.detectChanges();
    expect(el.textContent).toContain('Демо: приветствие');

    const scenarioNode = lessonNode.children()![0];
    await store.toggleNode(scenarioNode);
    treeFixture.detectChanges();
    expect(el.textContent).toContain('Hello');
  });

  it('renders search results as a filtered tree with ancestors', async () => {
    vi.useFakeTimers();
    try {
      const store = TestBed.inject(ContentExplorerStore);
      const treeFixture = TestBed.createComponent(ExplorerTreeComponent);
      const el = treeFixture.nativeElement as HTMLElement;
      await store.loadRoots();

      (treeFixture.componentInstance as unknown as { setFilter(query: string): void }).setFilter(
        'Hello',
      );
      treeFixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      treeFixture.detectChanges();

      expect(el.textContent).toContain('Английский A1');
      expect(el.textContent).toContain('Basics');
      expect(el.textContent).toContain('Приветствия');
      expect(el.textContent).toContain('Демо: приветствие');
      expect(el.textContent).toContain('Hello');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the expand toggle on matched scenarios and expands them in place', async () => {
    vi.useFakeTimers();
    try {
      const store = TestBed.inject(ContentExplorerStore);
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
            cardSourceSummary: '1 карточка',
            published: true,
            updatedAt: '2026-01-01T00:00:00Z',
            courseId: 'course-1',
          },
        ],
        totalItems: 1,
      } as never);

      const treeFixture = TestBed.createComponent(ExplorerTreeComponent);
      const el = treeFixture.nativeElement as HTMLElement;
      await store.loadRoots();

      (treeFixture.componentInstance as unknown as { setFilter(query: string): void }).setFilter(
        'Демо',
      );
      treeFixture.detectChanges();
      await vi.advanceTimersByTimeAsync(300);
      treeFixture.detectChanges();

      const scenarioRow = [...el.querySelectorAll('.tree-node')].find((row) =>
        row.textContent?.includes('Демо: приветствие'),
      ) as HTMLElement | undefined;
      expect(scenarioRow).toBeDefined();

      const toggle = scenarioRow!.querySelector('.tree-node__toggle') as HTMLButtonElement;
      expect(toggle.classList.contains('tree-node__toggle--hidden')).toBe(false);

      const scenarioNode = store.getByKey('scenario:scenario-1');
      expect(scenarioNode).not.toBeNull();
      await store.toggleNode(scenarioNode!);
      treeFixture.detectChanges();

      expect(el.textContent).toContain('Hello');
    } finally {
      vi.useRealTimers();
    }
  });

  it('selecting a node does not recurse infinitely', async () => {
    const store = TestBed.inject(ContentExplorerStore);
    const treeFixture = TestBed.createComponent(ExplorerTreeComponent);

    await store.loadRoots();
    treeFixture.detectChanges();

    store.selectNode(store.roots()[0]);
    treeFixture.detectChanges();
    expect(store.selectedId()).toBe('course-1');
  });
});
