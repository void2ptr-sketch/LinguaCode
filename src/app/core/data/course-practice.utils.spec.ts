import type { CardIndexEntry } from '../models/card-index.types';
import type { Scenario } from '../models/scenario.types';
import {
  buildScenarioDifficultyMap,
  collectCourseScenarioIds,
  filterScenarioIdsByDifficulty,
  isOpenPracticeCourse,
  resolveCoursePracticeSettings,
  resolveScenarioDifficulty,
} from './course-practice.utils';

describe('course-practice.utils', () => {
  it('defaults to guided practice', () => {
    expect(resolveCoursePracticeSettings(null).mode).toBe('guided');
    expect(isOpenPracticeCourse({})).toBeFalse();
  });

  it('detects open practice course', () => {
    expect(
      isOpenPracticeCourse({
        practiceSettings: { mode: 'open', requireLessonForScenarios: false },
      }),
    ).toBeTrue();
  });

  it('collects unique scenario ids from lessons', () => {
    const ids = collectCourseScenarioIds({
      lessons: [
        { id: 'l1', scenarioIds: ['s1', 's2'] },
        { id: 'l2', scenarioIds: ['s2', 's3'] },
      ],
    } as never);

    expect(ids).toEqual(['s1', 's2', 's3']);
  });

  it('resolves scenario difficulty from card tags', () => {
    const scenario: Scenario = {
      id: 's1',
      title: 'Q',
      description: '',
      authorId: 'system',
      published: true,
      updatedAt: '2026-01-01',
      cardSource: { mode: 'fixed', cardIds: ['c1'] },
    };
    const indexById = new Map<string, CardIndexEntry>([
      [
        'c1',
        {
          id: 'c1',
          kind: 'select',
          title: 'T',
          knownLanguage: 'ru',
          learningLanguage: 'perl',
          difficulty: 'beginner',
          tags: ['beginner', 'topic'],
          ipaReadings: [],
          updatedAt: '2026-01-01',
        },
      ],
    ]);

    expect(resolveScenarioDifficulty(scenario, indexById)).toBe('beginner');
  });

  it('filters scenario ids by difficulty', () => {
    const map = new Map([
      ['s1', 'beginner'],
      ['s2', 'advanced'],
    ] as const);

    expect(filterScenarioIdsByDifficulty(['s1', 's2'], map, 'beginner')).toEqual(['s1']);
    expect(filterScenarioIdsByDifficulty(['s1', 's2'], map, null)).toEqual(['s1', 's2']);
  });

  it('builds difficulty map for scenarios', () => {
    const scenarios: Scenario[] = [
      {
        id: 's1',
        title: 'A',
        description: '',
        authorId: 'system',
        published: true,
        updatedAt: '2026-01-01',
        cardSource: { mode: 'fixed', cardIds: ['c1'] },
      },
    ];
    const entries: CardIndexEntry[] = [
      {
        id: 'c1',
        kind: 'select',
        title: 'T',
        knownLanguage: 'ru',
        learningLanguage: 'perl',
        difficulty: 'intermediate',
        tags: ['intermediate'],
        ipaReadings: [],
        updatedAt: '2026-01-01',
      },
    ];

    expect(buildScenarioDifficultyMap(scenarios, entries).get('s1')).toBe('intermediate');
  });
});
