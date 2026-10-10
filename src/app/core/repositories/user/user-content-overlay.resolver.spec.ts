import type { Card, Course, Lesson, Scenario } from '../../../core/models';
import type { UserContentOverlay } from '../../../core/repositories/user/user-content-overlay.types';

import {
  computeCardsOverlay,
  computeCourseCatalogOverlay,
  computeScenariosOverlay,
  mergeLegacyCourseCatalogWithSeed,
  mergeLegacyScenariosWithSeed,
  resolveCards,
  resolveCourseCatalog,
  resolveScenarios,
} from './user-content-overlay.resolver';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: 'Description',
    authorId: 'user-1',
    languagePair: { known: 'en', learning: 'zh' },
    lessonIds: ['lesson-1'],
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    title: 'Test Lesson',
    description: 'Lesson desc',
    scenarioIds: ['scenario-1'],
    prerequisiteLessonIds: [],
    order: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-1',
    title: 'Test Scenario',
    description: 'Scenario desc',
    authorId: 'user-1',
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    cardSource: { mode: 'fixed', cardIds: ['card-1'] },
    languagePair: { known: 'en', learning: 'zh' },
    ...overrides,
  };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    kind: 'select',
    promptKnown: 'Hello',
    optionsLearning: ['Привет', 'Пока'],
    correctIndex: 0,
    direction: 'known-to-learning',
    ...overrides,
  } as Card;
}

function emptyOverlay(): UserContentOverlay {
  return {
    version: 1,
    courses: {},
    lessons: {},
    scenarios: {},
    cards: {},
    cardIndexMeta: {},
    deletedSystemIds: {},
  };
}

// ---------------------------------------------------------------------------
// resolveCourseCatalog
// ---------------------------------------------------------------------------

describe('resolveCourseCatalog', () => {
  it('returns seed courses and lessons when overlay is empty', () => {
    const seed = {
      courses: [makeCourse()],
      lessons: [makeLesson()],
    };
    const overlay = emptyOverlay();

    const result = resolveCourseCatalog(seed, overlay);

    expect(result.courses.length).toBe(1);
    expect(result.lessons.length).toBe(1);
    expect(result.courses[0].id).toBe('course-1');
    expect(result.lessons[0].id).toBe('lesson-1');
  });

  it('excludes deleted courses and lessons', () => {
    const seed = {
      courses: [makeCourse()],
      lessons: [makeLesson()],
    };
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      deletedSystemIds: {
        courses: ['course-1'],
        lessons: ['lesson-1'],
      },
    };

    const result = resolveCourseCatalog(seed, overlay);

    expect(result.courses.length).toBe(0);
    expect(result.lessons.length).toBe(0);
  });

  it('applies course overlay patch', () => {
    const seed = {
      courses: [makeCourse({ title: 'Original Title' })],
      lessons: [],
    };
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      courses: {
        'course-1': { title: 'Patched Title' },
      },
    };

    const result = resolveCourseCatalog(seed, overlay);

    expect(result.courses[0].title).toBe('Patched Title');
  });

  it('includes user-created courses from overlay', () => {
    const seed = { courses: [], lessons: [] };
    const userCourse = makeCourse({ id: 'user-course-1' });
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      courses: { 'user-course-1': userCourse },
    };

    const result = resolveCourseCatalog(seed, overlay);

    expect(result.courses.length).toBe(1);
    expect(result.courses[0].id).toBe('user-course-1');
  });

  it('includes user-created lessons from overlay', () => {
    const seed = { courses: [], lessons: [] };
    const userLesson = makeLesson({ id: 'user-lesson-1' });
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      lessons: { 'user-lesson-1': userLesson },
    };

    const result = resolveCourseCatalog(seed, overlay);

    expect(result.lessons.length).toBe(1);
    expect(result.lessons[0].id).toBe('user-lesson-1');
  });
});

// ---------------------------------------------------------------------------
// resolveScenarios
// ---------------------------------------------------------------------------

describe('resolveScenarios', () => {
  it('returns seed scenarios when overlay is empty', () => {
    const seed = [makeScenario()];
    const overlay = emptyOverlay();

    const result = resolveScenarios(seed, overlay);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('scenario-1');
  });

  it('excludes deleted scenarios', () => {
    const seed = [makeScenario()];
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      deletedSystemIds: { scenarios: ['scenario-1'] },
    };

    const result = resolveScenarios(seed, overlay);

    expect(result.length).toBe(0);
  });

  it('applies scenario overlay patch', () => {
    const seed = [makeScenario({ title: 'Original' })];
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      scenarios: { 'scenario-1': { title: 'Patched' } },
    };

    const result = resolveScenarios(seed, overlay);

    expect(result[0].title).toBe('Patched');
  });

  it('includes user-created scenarios from overlay', () => {
    const seed: Scenario[] = [];
    const userScenario = makeScenario({ id: 'user-scenario-1' });
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      scenarios: { 'user-scenario-1': userScenario },
    };

    const result = resolveScenarios(seed, overlay);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('user-scenario-1');
  });
});

// ---------------------------------------------------------------------------
// resolveCards
// ---------------------------------------------------------------------------

describe('resolveCards', () => {
  it('returns seed cards when overlay is empty', () => {
    const seed = [makeCard()];
    const overlay = emptyOverlay();

    const result = resolveCards(seed, overlay);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('card-1');
  });

  it('excludes deleted cards', () => {
    const seed = [makeCard()];
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      deletedSystemIds: { cards: ['card-1'] },
    };

    const result = resolveCards(seed, overlay);

    expect(result.length).toBe(0);
  });

  it('includes user-created cards from overlay', () => {
    const seed: Card[] = [];
    const userCard = makeCard({ id: 'user-card-1' });
    const overlay: UserContentOverlay = {
      ...emptyOverlay(),
      cards: { 'user-card-1': userCard },
    };

    const result = resolveCards(seed, overlay);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('user-card-1');
  });
});

// ---------------------------------------------------------------------------
// computeCourseCatalogOverlay
// ---------------------------------------------------------------------------

describe('computeCourseCatalogOverlay', () => {
  it('returns empty overlay when resolved matches seed', () => {
    const seed = {
      courses: [makeCourse()],
      lessons: [makeLesson()],
    };
    const resolved = { ...seed };
    const previous = emptyOverlay();

    const result = computeCourseCatalogOverlay(resolved, seed, previous);

    expect(Object.keys(result.courses).length).toBe(0);
    expect(Object.keys(result.lessons).length).toBe(0);
  });

  it('captures course title change as patch', () => {
    const seed = {
      courses: [makeCourse({ title: 'Original' })],
      lessons: [],
    };
    const resolved = {
      courses: [makeCourse({ title: 'Changed' })],
      lessons: [],
    };
    const previous = emptyOverlay();

    const result = computeCourseCatalogOverlay(resolved, seed, previous);

    expect(result.courses['course-1'].title).toBe('Changed');
  });

  it('tracks deleted courses in deletedSystemIds', () => {
    const seed = {
      courses: [makeCourse()],
      lessons: [],
    };
    const resolved = { courses: [], lessons: [] };
    const previous = emptyOverlay();

    const result = computeCourseCatalogOverlay(resolved, seed, previous);

    expect(result.deletedSystemIds?.courses).toContain('course-1');
  });
});

// ---------------------------------------------------------------------------
// computeScenariosOverlay
// ---------------------------------------------------------------------------

describe('computeScenariosOverlay', () => {
  it('returns empty overlay when resolved matches seed', () => {
    const seed = [makeScenario()];
    const resolved = seed;
    const previous = emptyOverlay();

    const result = computeScenariosOverlay(resolved, seed, previous);

    expect(Object.keys(result.scenarios).length).toBe(0);
  });

  it('captures scenario title change as patch', () => {
    const seed = [makeScenario({ title: 'Original' })];
    const resolved = [makeScenario({ title: 'Changed' })];
    const previous = emptyOverlay();

    const result = computeScenariosOverlay(resolved, seed, previous);

    expect(result.scenarios['scenario-1'].title).toBe('Changed');
  });

  it('tracks deleted scenarios in deletedSystemIds', () => {
    const seed = [makeScenario()];
    const resolved: Scenario[] = [];
    const previous = emptyOverlay();

    const result = computeScenariosOverlay(resolved, seed, previous);

    expect(result.deletedSystemIds?.scenarios).toContain('scenario-1');
  });
});

// ---------------------------------------------------------------------------
// computeCardsOverlay
// ---------------------------------------------------------------------------

describe('computeCardsOverlay', () => {
  it('returns empty overlay when resolved matches seed', () => {
    const seed = [makeCard()];
    const resolved = seed;
    const previous = emptyOverlay();

    const result = computeCardsOverlay(resolved, seed, previous);

    expect(Object.keys(result.cards).length).toBe(0);
  });

  it('tracks deleted cards in deletedSystemIds', () => {
    const seed = [makeCard()];
    const resolved: Card[] = [];
    const previous = emptyOverlay();

    const result = computeCardsOverlay(resolved, seed, previous);

    expect(result.deletedSystemIds?.cards).toContain('card-1');
  });
});

// ---------------------------------------------------------------------------
// Legacy merge functions
// ---------------------------------------------------------------------------

describe('mergeLegacyCourseCatalogWithSeed', () => {
  it('merges legacy courses with seed', () => {
    const stored = {
      courses: [makeCourse({ id: 'legacy-1', title: 'Legacy Course' })],
      lessons: [makeLesson({ id: 'legacy-lesson-1' })],
    };
    const seed = {
      courses: [makeCourse()],
      lessons: [makeLesson()],
    };

    const result = mergeLegacyCourseCatalogWithSeed(stored, seed);

    expect(result.courses.length).toBeGreaterThan(0);
    expect(result.lessons.length).toBeGreaterThan(0);
  });
});

describe('mergeLegacyScenariosWithSeed', () => {
  it('merges legacy scenarios with seed', () => {
    const stored = [makeScenario({ id: 'legacy-scenario-1', title: 'Legacy' })];
    const seed = [makeScenario()];

    const result = mergeLegacyScenariosWithSeed(stored, seed);

    expect(result.length).toBeGreaterThan(0);
  });
});
