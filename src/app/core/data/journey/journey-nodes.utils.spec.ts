import {
  buildScenarioMap,
  buildJourneyNodes,
  mapScenarioToNode,
} from './journey-nodes.utils';
import type { CourseWithLessons, Lesson, Scenario } from '../../models';
import type { JourneyLocationNode } from '../../models/journey.types';

describe('journey-nodes.utils', () => {
  describe('buildScenarioMap', () => {
    it('should create a map from scenario array', () => {
      const scenarios: Scenario[] = [
        { id: 's1', title: 'First', description: 'Desc 1', authorId: 'u1', cardSource: { mode: 'fixed', cardIds: ['c1'] }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 's2', title: 'Second', description: 'Desc 2', authorId: 'u1', cardSource: { mode: 'fixed', cardIds: ['c1', 'c2'] }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' },
      ];

      const map = buildScenarioMap(scenarios);

      expect(map.size).toBe(2);
      expect(map.get('s1')?.title).toBe('First');
      expect(map.get('s2')?.title).toBe('Second');
      expect(map.get('nonexistent')).toBeUndefined();
    });

    it('should return empty map for empty array', () => {
      const map = buildScenarioMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('mapScenarioToNode', () => {
    const baseScenario: Scenario = {
      id: 'scenario-test-01',
      title: 'Тестовый сценарий',
      description: 'Описание сценария',
      authorId: 'system',
      cardSource: { mode: 'fixed', cardIds: ['c1', 'c2', 'c3'] },
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const baseOptions = {
      lessonId: 'lesson-1',
      lessonTitle: 'Урок 1',
      courseId: 'course-1',
      courseTitle: 'Курс 1',
      order: 0,
      status: 'available' as const,
      contentType: 'practice' as const,
      completionPercent: 0,
      visited: false,
      favorite: false,
      blockReason: null,
    };

    it('should map scenario to node with correct fields', () => {
      const node = mapScenarioToNode(baseScenario, baseOptions);

      expect(node.id).toBe('node-scenario-test-01');
      expect(node.title).toBe('Тестовый сценарий');
      expect(node.description).toBe('Описание сценария');
      expect(node.cardCount).toBe(3);
      expect(node.order).toBe(0);
      expect(node.status).toBe('available');
      expect(node.contentType).toBe('practice');
      expect(node.lessonId).toBe('lesson-1');
      expect(node.lessonTitle).toBe('Урок 1');
      expect(node.courseId).toBe('course-1');
      expect(node.courseTitle).toBe('Курс 1');
      expect(node.completionPercent).toBe(0);
      expect(node.visited).toBe(false);
      expect(node.favorite).toBe(false);
      expect(node.blockReason).toBeNull();
      expect(node.scenarioId).toBe('scenario-test-01');
    });

    it('should set cardCount to 0 for criteria-based cardSource', () => {
      const criteriaScenario: Scenario = {
        ...baseScenario,
        id: 'scenario-criteria',
        cardSource: { mode: 'criteria', criteria: {} },
      };

      const node = mapScenarioToNode(criteriaScenario, baseOptions);
      expect(node.cardCount).toBe(0);
    });

    it('should handle empty description', () => {
      const scenario: Scenario = {
        ...baseScenario,
        description: '',
      };

      const node = mapScenarioToNode(scenario, baseOptions);
      expect(node.description).toBe('');
    });

    it('should handle missing description', () => {
      const scenario: Scenario = {
        ...baseScenario,
        description: undefined as unknown as string,
      };

      const node = mapScenarioToNode(scenario, baseOptions);
      expect(node.description).toBe('');
    });
  });

  describe('buildJourneyNodes', () => {
    const baseCourse: CourseWithLessons = {
      id: 'course-radicals',
      title: 'Радикалы Канси',
      description: 'Курс радикалов',
      authorId: 'system',
      languagePair: { known: 'ru', learning: 'zh' },
      lessonIds: ['lesson-1', 'lesson-2'],
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      lessons: [
        {
          id: 'lesson-1',
          courseId: 'course-radicals',
          title: 'Урок 1',
          description: 'Описание урока 1',
          scenarioIds: ['scenario-01', 'scenario-02'],
          prerequisiteLessonIds: [],
          order: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'lesson-2',
          courseId: 'course-radicals',
          title: 'Урок 2',
          description: 'Описание урока 2',
          scenarioIds: ['scenario-03'],
          prerequisiteLessonIds: ['lesson-1'],
          order: 2,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const scenarioMap = buildScenarioMap([
      {
        id: 'scenario-01',
        title: 'Радикалы 1–10',
        description: '10 карточек: радикалы Канси №1–10',
        authorId: 'system',
        cardSource: { mode: 'fixed', cardIds: Array.from({ length: 10 }, (_, i) => `card-${i + 1}`) },
        published: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'scenario-02',
        title: 'Радикалы 11–20',
        description: '10 карточек: радикалы Канси №11–20',
        authorId: 'system',
        cardSource: { mode: 'fixed', cardIds: Array.from({ length: 10 }, (_, i) => `card-${i + 11}`) },
        published: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'scenario-03',
        title: 'Радикалы 21–30',
        description: '10 карточек: радикалы Канси №21–30',
        authorId: 'system',
        cardSource: { mode: 'fixed', cardIds: Array.from({ length: 10 }, (_, i) => `card-${i + 21}`) },
        published: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    it('should build nodes from course with lessons', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      expect(nodes).toHaveLength(3);
      expect(nodes[0].title).toBe('Радикалы 1–10');
      expect(nodes[0].description).toBe('10 карточек: радикалы Канси №1–10');
      expect(nodes[0].cardCount).toBe(10);
      expect(nodes[0].scenarioId).toBe('scenario-01');
      expect(nodes[0].status).toBe('available');
    });

    it('should use real scenario title instead of placeholder', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      // Раньше было 'Сценарий 1', теперь реальное название
      expect(nodes[0].title).not.toBe('Сценарий 1');
      expect(nodes[0].title).toBe('Радикалы 1–10');
      expect(nodes[1].title).toBe('Радикалы 11–20');
      expect(nodes[2].title).toBe('Радикалы 21–30');
    });

    it('should compute correct order for nodes', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      // order = lesson.order * 100 + scenarioIndex
      expect(nodes[0].order).toBe(100); // lesson-1 (order=1) * 100 + 0
      expect(nodes[1].order).toBe(101); // lesson-1 (order=1) * 100 + 1
      expect(nodes[2].order).toBe(200); // lesson-2 (order=2) * 100 + 0
    });

    it('should mark in-progress scenarios when hasScenarioResult returns true', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        (scenarioId) => scenarioId === 'scenario-01',
        () => false,
      );

      // scenario-01 has result but lesson not fully completed => in-progress
      expect(nodes[0].status).toBe('in-progress');
      expect(nodes[1].status).toBe('available');
      expect(nodes[2].status).toBe('locked'); // lesson-2 depends on lesson-1
    });

    it('should mark visited scenarios when hasScenarioVisit returns true', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        (scenarioId) => scenarioId === 'scenario-02',
      );

      expect(nodes[1].status).toBe('visited');
    });

    it('should mark locked when lesson prerequisites not met', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      // lesson-2 depends on lesson-1, which has no completed scenarios
      expect(nodes[2].status).toBe('locked');
      expect(nodes[2].blockReason).toContain('Урок 1');
    });

    it('should compute completion percent per lesson', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      // lesson-1 has 2 scenarios, 0 completed => 0%
      expect(nodes[0].completionPercent).toBe(0);
      expect(nodes[1].completionPercent).toBe(0);

      // All scenarios completed => 100%
      const nodesAllComplete = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => true,
        () => false,
      );

      expect(nodesAllComplete[0].completionPercent).toBe(100);
      expect(nodesAllComplete[1].completionPercent).toBe(100);
    });

    it('should use default contentType when getScenarioContentType not provided', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
      );

      expect(nodes[0].contentType).toBe('theory');
    });

    it('should use custom contentType when provided', () => {
      const nodes = buildJourneyNodes(
        baseCourse,
        scenarioMap,
        () => false,
        () => false,
        () => 'practice',
      );

      expect(nodes[0].contentType).toBe('practice');
    });

    it('should fallback to placeholder title when scenario not in map', () => {
      const courseWithUnknownScenario: CourseWithLessons = {
        ...baseCourse,
        lessons: [
          {
            id: 'lesson-1',
            courseId: 'course-radicals',
            title: 'Урок 1',
            description: 'Описание',
            scenarioIds: ['scenario-missing'],
            prerequisiteLessonIds: [],
            order: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      const nodes = buildJourneyNodes(
        courseWithUnknownScenario,
        scenarioMap,
        () => false,
        () => false,
      );

      expect(nodes[0].title).toBe('Сценарий 1');
      expect(nodes[0].description).toBe('');
      expect(nodes[0].cardCount).toBe(0);
    });

    it('should handle empty lesson scenarioIds', () => {
      const courseWithEmptyLesson: CourseWithLessons = {
        ...baseCourse,
        lessons: [
          {
            id: 'lesson-1',
            courseId: 'course-radicals',
            title: 'Урок 1',
            description: 'Описание',
            scenarioIds: [],
            prerequisiteLessonIds: [],
            order: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      const nodes = buildJourneyNodes(
        courseWithEmptyLesson,
        scenarioMap,
        () => false,
        () => false,
      );

      expect(nodes).toHaveLength(0);
    });
  });
});
