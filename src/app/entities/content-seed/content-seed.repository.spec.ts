import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { IndexedDbService } from '../../shared/storage';
import type { Card } from '../card/model';
import type { Course, Lesson } from '../course/model';
import type { Scenario } from '../scenario/model';

import {
  getCardSeedCache,
  getCourseSeedCache,
  getScenarioSeedCache,
  isContentSeedCacheReady,
  resetContentSeedCache,
  setCardSeedCache,
  setCourseSeedCache,
  setScenarioSeedCache,
} from './content-seed.cache';
import type { ContentSeedSnapshot } from './content-seed.idb';
import { ContentSeedRepository } from './content-seed.repository';
import type { ContentManifest, CoursesNestedFixture } from './content-seed.types';

const MANIFEST_URL = '/data/content-manifest.json';

function makeManifest(overrides?: Partial<ContentManifest>): ContentManifest {
  return {
    version: 1,
    cardFiles: [],
    scenarioFiles: [],
    courseFiles: [],
    ...overrides,
  };
}

function makeScenarioFixture(): Scenario {
  return {
    id: 's1',
    title: 'Scenario 1',
    description: 'Test scenario',
    authorId: 'local-user',
    cardIds: ['card-1'],
    published: false,
    updatedAt: new Date(0).toISOString(),
  } as unknown as Scenario;
}

function makeCourseFixture(): Course {
  return {
    id: 'c1',
    title: 'Course 1',
    description: 'Test course',
    authorId: 'local-user',
    languagePair: { known: 'ru', learning: 'en' },
    programIds: ['p1'],
    published: false,
    updatedAt: new Date(0).toISOString(),
  } as unknown as Course;
}

function makeLessonFixture(): Lesson {
  return {
    id: 'l1',
    programId: 'p1',
    title: 'Lesson 1',
    description: 'Test lesson',
    scenarioIds: [],
    prerequisiteLessonIds: [],
    order: 0,
    updatedAt: new Date(0).toISOString(),
  } as unknown as Lesson;
}

function makeCardFixture(): Card {
  return {
    id: 'card-1',
    kind: 'select',
    title: 'Card 1',
    appearance: { theme: 'default', fontSize: 'md' },
    promptKnown: 'Hello',
    optionsLearning: [],
  } as unknown as Card;
}

/**
 * In-memory заглушка IndexedDbService для тестов.
 * jsdom не реализует IndexedDB, поэтому реальный сервис в тестах
 * всегда отклоняет запросы — здесь мы контролируем снапшот вручную.
 */
class MockIndexedDbService {
  private readonly records = new Map<string, unknown>();

  private recordKey(storeName: string, key: IDBValidKey): string {
    return `${storeName}:${String(key)}`;
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.records.get(this.recordKey(storeName, key)) as T | undefined;
  }

  async set(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
    this.records.set(this.recordKey(storeName, key ?? 'default'), value);
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    this.records.delete(this.recordKey(storeName, key));
  }

  async getAll<T>(storeName: string): Promise<readonly T[]> {
    return [...this.records.entries()]
      .filter(([recordKey]) => recordKey.startsWith(`${storeName}:`))
      .map(([, value]) => value as T);
  }

  async clear(storeName: string): Promise<void> {
    for (const recordKey of [...this.records.keys()]) {
      if (recordKey.startsWith(`${storeName}:`)) {
        this.records.delete(recordKey);
      }
    }
  }

  getSnapshot(): ContentSeedSnapshot | null {
    const value = this.records.get(this.recordKey('content-seed', 'snapshot'));
    return (value as ContentSeedSnapshot | undefined) ?? null;
  }

  setSnapshot(snapshot: ContentSeedSnapshot | null): void {
    if (snapshot === null) {
      this.records.delete(this.recordKey('content-seed', 'snapshot'));
    } else {
      this.records.set(this.recordKey('content-seed', 'snapshot'), snapshot);
    }
  }
}

describe('ContentSeedRepository', () => {
  let repository: ContentSeedRepository;
  let httpMock: HttpTestingController;
  let idbMock: MockIndexedDbService;

  function createRepository(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IndexedDbService, useClass: MockIndexedDbService },
      ],
    });
    repository = TestBed.inject(ContentSeedRepository);
    httpMock = TestBed.inject(HttpTestingController);
    idbMock = TestBed.inject(IndexedDbService) as unknown as MockIndexedDbService;
  }

  function flushManifest(manifest: ContentManifest = makeManifest()): void {
    httpMock.expectOne(MANIFEST_URL).flush(manifest);
  }

  /** Ожидает появления запроса fixture-файла (выдаётся в микротасках после manifest) и отвечает на него. */
  async function waitForRequest(url: string): Promise<TestRequest> {
    for (let attempt = 0; attempt < 50; attempt++) {
      const requests = httpMock.match(url);
      if (requests.length > 0) {
        return requests[0]!;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    throw new Error(`Request not issued: ${url}`);
  }

  async function flushFixture(url: string, body: object): Promise<void> {
    (await waitForRequest(url)).flush(body);
  }

  describe('preload', () => {
    it('should resolve immediately when the cache is ready', async () => {
      resetContentSeedCache();
      setScenarioSeedCache([makeScenarioFixture()]);
      setCourseSeedCache({
        courses: [makeCourseFixture()],
        programs: [],
        lessons: [makeLessonFixture()],
      });
      setCardSeedCache([makeCardFixture()]);
      createRepository();

      await repository.preload();

      httpMock.verify();
    });

    it('should load manifest and cache normalized seeds', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(
        makeManifest({
          scenarioFiles: ['scenarios/demo.json'],
          courseFiles: ['courses/demo.json'],
          cardFiles: ['cards/demo.json'],
        }),
      );
      await flushFixture('/data/scenarios/demo.json', { scenarios: [makeScenarioFixture()] });
      await flushFixture('/data/courses/demo.json', {
        courses: [makeCourseFixture()],
        lessons: [makeLessonFixture()],
      });
      await flushFixture('/data/cards/demo.json', { cards: [makeCardFixture()] });
      await promise;

      expect(isContentSeedCacheReady()).toBe(true);

      const scenarios = getScenarioSeedCache();
      expect(scenarios).toHaveLength(1);
      expect(scenarios[0]?.id).toBe('s1');
      if (scenarios[0]?.cardSource.mode === 'fixed') {
        expect(scenarios[0].cardSource.cardIds).toEqual(['card-1']);
      }

      const courses = getCourseSeedCache();
      expect(courses.courses.map((course) => course.id)).toEqual(['c1']);
      expect(courses.lessons.map((lesson) => lesson.id)).toEqual(['l1']);

      expect(getCardSeedCache().map((card) => card.id)).toEqual(['card-1']);
    });

    it('should deduplicate concurrent preload calls', async () => {
      resetContentSeedCache();
      createRepository();

      const first = repository.preload();
      const second = repository.preload();

      flushManifest();
      await Promise.all([first, second]);

      httpMock.expectNone(MANIFEST_URL);
    });

    it('should not re-request data on subsequent preload calls', async () => {
      resetContentSeedCache();
      createRepository();

      const first = repository.preload();
      flushManifest();
      await first;

      await repository.preload();

      httpMock.expectNone(MANIFEST_URL);
    });

    it('should ignore network errors and allow subsequent preload', async () => {
      resetContentSeedCache();
      createRepository();

      // First preload fails (500) — silently ignored, cache remains empty
      const first = repository.preload();
      httpMock.expectOne(MANIFEST_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await first;
      expect(isContentSeedCacheReady()).toBe(false);

      // Reset the failed promise to allow new preload
      repository.resetForTest();

      // Retry succeeds
      const retried = repository.preload();
      flushManifest();
      await retried;

      httpMock.verify();
    });

    it('should store an empty cards list when a card fixture is missing', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(makeManifest({ cardFiles: ['cards/missing.json'] }));
      (await waitForRequest('/data/cards/missing.json')).flush('not found', {
        status: 404,
        statusText: 'Not Found',
      });
      await promise;

      expect(getCardSeedCache()).toEqual([]);
    });

    it('should hydrate from IndexedDB snapshot when version matches (no fixture requests)', async () => {
      resetContentSeedCache();
      createRepository();
      idbMock.setSnapshot({
        version: 1,
        scenarios: [makeScenarioFixture()],
        courses: [makeCourseFixture()],
        programs: [],
        lessons: [makeLessonFixture()],
        cards: [makeCardFixture()],
      });

      const promise = repository.preload();
      flushManifest(makeManifest({ version: 1 }));
      await promise;

      expect(isContentSeedCacheReady()).toBe(true);
      expect(getScenarioSeedCache()[0]?.id).toBe('s1');
      expect(getCourseSeedCache().courses[0]?.id).toBe('c1');
      expect(getCourseSeedCache().lessons[0]?.id).toBe('l1');
      expect(getCardSeedCache()[0]?.id).toBe('card-1');
      httpMock.verify();
    });

    it('should fall back to IndexedDB snapshot when manifest is unavailable (offline)', async () => {
      resetContentSeedCache();
      createRepository();
      idbMock.setSnapshot({
        version: 1,
        scenarios: [makeScenarioFixture()],
        courses: [],
        programs: [],
        lessons: [],
        cards: [],
      });

      const promise = repository.preload();
      httpMock.expectOne(MANIFEST_URL).error(new ProgressEvent('offline'));
      await promise;

      expect(getScenarioSeedCache()[0]?.id).toBe('s1');
    });

    it('should re-fetch fixtures when snapshot version is stale', async () => {
      resetContentSeedCache();
      createRepository();
      idbMock.setSnapshot({
        version: 0,
        scenarios: [],
        courses: [],
        programs: [],
        lessons: [],
        cards: [],
      });

      const promise = repository.preload();
      flushManifest(makeManifest({ version: 1, scenarioFiles: ['scenarios/demo.json'] }));
      await flushFixture('/data/scenarios/demo.json', { scenarios: [makeScenarioFixture()] });
      await promise;

      expect(getScenarioSeedCache()[0]?.id).toBe('s1');
      expect(idbMock.getSnapshot()?.version).toBe(1);
    });

    it('should persist snapshot to IndexedDB after network load', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(makeManifest({ scenarioFiles: ['scenarios/demo.json'] }));
      await flushFixture('/data/scenarios/demo.json', { scenarios: [makeScenarioFixture()] });
      await promise;

      const snapshot = idbMock.getSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot?.version).toBe(1);
      expect(snapshot?.scenarios).toHaveLength(1);
      expect(snapshot?.scenarios[0]?.id).toBe('s1');
    });
  });

  describe('seed getters', () => {
    it('should return data from the seed cache', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(
        makeManifest({
          scenarioFiles: ['scenarios/demo.json'],
          cardFiles: ['cards/demo.json'],
        }),
      );
      await flushFixture('/data/scenarios/demo.json', { scenarios: [makeScenarioFixture()] });
      await flushFixture('/data/cards/demo.json', { cards: [makeCardFixture()] });
      await promise;

      expect(repository.getScenarioSeed()).toEqual(getScenarioSeedCache());
      expect(repository.getCardSeed()).toEqual(getCardSeedCache());
      expect(repository.getCourseSeed()).toEqual(getCourseSeedCache());
    });
  });

  describe('mergeCourseFixtures', () => {
    it('should deduplicate courses and lessons by id across files', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(makeManifest({ courseFiles: ['courses/a.json', 'courses/b.json'] }));
      await flushFixture('/data/courses/a.json', {
        courses: [{ ...makeCourseFixture(), title: 'A' }],
        lessons: [{ ...makeLessonFixture(), title: 'A1' }],
      });
      await flushFixture('/data/courses/b.json', {
        courses: [{ ...makeCourseFixture(), title: 'B' }],
        lessons: [{ ...makeLessonFixture(), title: 'B1' }],
      });
      await promise;

      const courses = getCourseSeedCache();
      expect(courses.courses).toHaveLength(1);
      expect(courses.courses[0]?.title).toBe('B');
      expect(courses.lessons).toHaveLength(1);
      expect(courses.lessons[0]?.title).toBe('B1');
    });
  });

  describe('nested course format', () => {
    function makeNestedFixture(overrides?: Partial<CoursesNestedFixture>): CoursesNestedFixture {
      return {
        id: 'nested-course-1',
        title: 'Nested Course',
        description: 'Test nested course',
        languagePair: { known: 'ru', learning: 'en' },
        published: true,
        authoring: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        programs: [
          {
            id: 'nested-program-1',
            title: 'Program 1',
            description: 'First program',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'nested-lesson-1',
                title: 'Lesson 1',
                description: 'First lesson',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'nested-scenario-1',
                    title: 'Scenario 1',
                    description: 'First scenario',
                    order: 0,
                    published: true,
                    cards: [
                      {
                        id: 'nested-card-1',
                        kind: 'select',
                        title: 'Nested Card 1',
                        appearance: { theme: 'azure-blue', fontSize: 'md' },
                        direction: 'known-to-learning' as const,
                        promptKnown: 'Hello',
                        optionsLearning: ['Привет'],
                        correctIndex: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        ...overrides,
      };
    }

    it('should load nested course fixture and extract cards', async () => {
      resetContentSeedCache();
      createRepository();

      const promise = repository.preload();
      flushManifest(makeManifest({ courseFiles: ['courses/nested.json'] }));
      await flushFixture('/data/courses/nested.json', makeNestedFixture());
      await promise;

      const courses = getCourseSeedCache();
      expect(courses.courses).toHaveLength(1);
      expect(courses.courses[0].id).toBe('nested-course-1');
      expect(courses.courses[0].title).toBe('Nested Course');
      expect(courses.programs).toHaveLength(1);
      expect(courses.programs[0].id).toBe('nested-program-1');
      expect(courses.programs[0].courseId).toBe('nested-course-1');
      expect(courses.lessons).toHaveLength(1);
      expect(courses.lessons[0].id).toBe('nested-lesson-1');
      expect(courses.lessons[0].programId).toBe('nested-program-1');

      const cards = getCardSeedCache();
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('nested-card-1');
    });

    it('should handle nested fixture with multiple programs and lessons', async () => {
      resetContentSeedCache();
      createRepository();

      const nested = makeNestedFixture({
        programs: [
          {
            id: 'prog-a',
            title: 'Program A',
            description: '',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-a1',
                title: 'Lesson A1',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-a1',
                    title: 'Scenario A1',
                    description: '',
                    order: 0,
                    published: true,
                    cards: [
                      { id: 'card-a1', kind: 'flip', title: 'Card A1', appearance: { theme: 'a', fontSize: 'md' }, front: 'a', back: 'b' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'prog-b',
            title: 'Program B',
            description: '',
            order: 1,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-b1',
                title: 'Lesson B1',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-b1',
                    title: 'Scenario B1',
                    description: '',
                    order: 0,
                    published: true,
                    cards: [
                      { id: 'card-b1', kind: 'flip', title: 'Card B1', appearance: { theme: 'a', fontSize: 'md' }, front: 'c', back: 'd' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const promise = repository.preload();
      flushManifest(makeManifest({ courseFiles: ['courses/multi.json'] }));
      await flushFixture('/data/courses/multi.json', nested);
      await promise;

      const courses = getCourseSeedCache();
      expect(courses.courses).toHaveLength(1);
      expect(courses.programs).toHaveLength(2);
      expect(courses.lessons).toHaveLength(2);
      expect(courses.courses[0].programIds).toEqual(['prog-a', 'prog-b']);
      expect(courses.programs[0].lessonIds).toEqual(['lesson-a1']);
      expect(courses.programs[1].lessonIds).toEqual(['lesson-b1']);

      const cards = getCardSeedCache();
      expect(cards).toHaveLength(2);
      expect(cards.map((c) => c.id)).toEqual(['card-a1', 'card-b1']);
    });

    it('should mix nested and legacy course fixtures', async () => {
      resetContentSeedCache();
      createRepository();

      const nested = makeNestedFixture({ id: 'nested-course' });
      const legacyCourse = makeCourseFixture();
      const legacyLesson = makeLessonFixture();

      const promise = repository.preload();
      flushManifest(makeManifest({ courseFiles: ['courses/nested.json', 'courses/legacy.json'] }));
      await flushFixture('/data/courses/nested.json', nested);
      await flushFixture('/data/courses/legacy.json', {
        courses: [legacyCourse],
        lessons: [legacyLesson],
      });
      await promise;

      const courses = getCourseSeedCache();
      // Both courses should be present since they have different IDs
      expect(courses.courses).toHaveLength(2);
      expect(courses.courses.map((c) => c.id)).toContain('nested-course');
      expect(courses.courses.map((c) => c.id)).toContain('c1');
    });
  });
});
