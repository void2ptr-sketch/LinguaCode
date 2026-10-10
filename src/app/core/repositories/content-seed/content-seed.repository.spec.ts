import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { Card, Course, Lesson, Scenario } from '../../models';

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
import { ContentSeedRepository } from './content-seed.repository';
import type { ContentManifest } from './content-seed.types';

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
    lessonIds: ['l1'],
    published: false,
    updatedAt: new Date(0).toISOString(),
  } as Course;
}

function makeLessonFixture(): Lesson {
  return {
    id: 'l1',
    courseId: 'c1',
    title: 'Lesson 1',
    description: 'Test lesson',
    scenarioIds: [],
    prerequisiteLessonIds: [],
    order: 0,
    updatedAt: new Date(0).toISOString(),
  } as Lesson;
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

describe('ContentSeedRepository', () => {
  let repository: ContentSeedRepository;
  let httpMock: HttpTestingController;

  function createRepository(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(ContentSeedRepository);
    httpMock = TestBed.inject(HttpTestingController);
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
      setCourseSeedCache({ courses: [makeCourseFixture()], lessons: [makeLessonFixture()] });
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

    it('should allow retry after a failed preload', async () => {
      resetContentSeedCache();
      createRepository();

      const failed = repository.preload().catch((error: unknown) => error);
      httpMock.expectOne(MANIFEST_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      expect(await failed).toBeDefined();

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
});
