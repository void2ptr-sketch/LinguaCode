import { describe, expect, it } from 'vitest';

import { extractEntitiesFromBundle } from './course-bundle-import.utils';
import type {
  CourseBundle,
  CourseBundleV1,
} from '../../../entities/course/utils/course-bundle.types';

// ── Test fixtures (using `as const` for strict type compatibility) ──

const mockCourse = {
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  slug: 'test-course',
  programIds: ['prog-1'],
  published: true,
  authorId: 'local-user',
  languagePair: { known: 'ru' as const, learning: 'en' as const },
  updatedAt: new Date().toISOString(),
  authoring: {
    status: 'draft',
    idea: 'Test idea',
    ideaUpdatedAt: new Date().toISOString(),
    materializedAt: undefined,
    lastError: null,
  },
} as const;

const mockProgram = {
  id: 'prog-1',
  title: 'Test Program',
  description: 'A test program',
  lessonIds: ['lesson-1'],
  courseId: 'course-1',
  order: 0,
  updatedAt: new Date().toISOString(),
} as const;

const mockLesson = {
  id: 'lesson-1',
  title: 'Test Lesson',
  description: 'A test lesson',
  scenarioIds: ['scenario-1'],
  prerequisiteLessonIds: [],
  programId: 'prog-1',
  order: 0,
  updatedAt: new Date().toISOString(),
} as const;

const mockScenario = {
  id: 'scenario-1',
  title: 'Test Scenario',
  description: 'A test scenario',
  cardSource: { mode: 'fixed' as const, cardIds: ['card-1'] },
  published: true,
  authorId: 'local-user',
  order: 0,
  updatedAt: new Date().toISOString(),
} as const;

const mockCard = {
  id: 'card-1',
  kind: 'flip' as const,
  title: 'Test Card',
  appearance: { theme: 'azure-blue', fontSize: 'md' as const },
  front: 'Stimulus',
  back: 'Response',
  order: 0,
} as const;

const mockMeta = {
  hints: ['hint 1'],
  tags: ['tag1'],
};

// ── v2 tests ──

describe('extractEntitiesFromBundle — v2', () => {
  it('should extract entities from a v2 nested bundle', () => {
    const bundle: CourseBundle = {
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      course: mockCourse,
      programs: [
        {
          program: mockProgram,
          order: 0,
          lessons: [
            {
              lesson: mockLesson,
              order: 0,
              scenarios: [
                {
                  scenario: mockScenario,
                  order: 0,
                  cards: [{ card: mockCard, order: 0, meta: mockMeta }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = extractEntitiesFromBundle(bundle);

    expect(result).not.toBeNull();
    expect(result!.courses).toEqual({ 'course-1': mockCourse });
    expect(result!.programs).toEqual({ 'prog-1': mockProgram });
    expect(result!.lessons).toEqual({ 'lesson-1': mockLesson });
    expect(result!.scenarios).toEqual({ 'scenario-1': mockScenario });
    expect(result!.cards).toEqual({ 'card-1': mockCard });
    expect(result!.cardIndexMeta).toEqual({ 'card-1': mockMeta });
  });

  it('should handle empty programs array', () => {
    const emptyProgramsCourse = { ...mockCourse, programIds: [] };
    const bundle: CourseBundle = {
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      course: emptyProgramsCourse,
      programs: [],
    };

    const result = extractEntitiesFromBundle(bundle);

    expect(result).not.toBeNull();
    expect(result!.courses).toEqual({ 'course-1': emptyProgramsCourse });
    expect(result!.programs).toEqual({});
    expect(result!.lessons).toEqual({});
    expect(result!.scenarios).toEqual({});
    expect(result!.cards).toEqual({});
    expect(result!.cardIndexMeta).toEqual({});
  });

  it('should extract multiple programs, lessons, scenarios, and cards', () => {
    const bundle: CourseBundle = {
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      course: { ...mockCourse, programIds: ['prog-1', 'prog-2'] },
      programs: [
        {
          program: { ...mockProgram, id: 'prog-1' },
          order: 0,
          lessons: [
            {
              lesson: { ...mockLesson, id: 'lesson-1' },
              order: 0,
              scenarios: [
                {
                  scenario: { ...mockScenario, id: 'scenario-1' },
                  order: 0,
                  cards: [{ card: { ...mockCard, id: 'card-1' }, order: 0, meta: mockMeta }],
                },
              ],
            },
          ],
        },
        {
          program: { ...mockProgram, id: 'prog-2' },
          order: 1,
          lessons: [
            {
              lesson: { ...mockLesson, id: 'lesson-2' },
              order: 0,
              scenarios: [
                {
                  scenario: { ...mockScenario, id: 'scenario-2' },
                  order: 0,
                  cards: [{ card: { ...mockCard, id: 'card-2' }, order: 0, meta: mockMeta }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = extractEntitiesFromBundle(bundle);

    expect(result).not.toBeNull();
    expect(Object.keys(result!.courses)).toHaveLength(1);
    expect(Object.keys(result!.programs)).toHaveLength(2);
    expect(Object.keys(result!.lessons)).toHaveLength(2);
    expect(Object.keys(result!.scenarios)).toHaveLength(2);
    expect(Object.keys(result!.cards)).toHaveLength(2);
  });
});

// ── v1 tests ──

describe('extractEntitiesFromBundle — v1', () => {
  it('should extract entities from a v1 flat bundle', () => {
    const bundle: CourseBundleV1 = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      course: {
        courses: [mockCourse],
        programs: [mockProgram],
        lessons: [mockLesson],
      },
      scenarios: [mockScenario],
      cards: [mockCard],
      cardIndexMeta: { 'card-1': mockMeta },
    };

    const result = extractEntitiesFromBundle(bundle);

    expect(result).not.toBeNull();
    expect(result!.courses).toEqual({ 'course-1': mockCourse });
    expect(result!.programs).toEqual({ 'prog-1': mockProgram });
    expect(result!.lessons).toEqual({ 'lesson-1': mockLesson });
    expect(result!.scenarios).toEqual({ 'scenario-1': mockScenario });
    expect(result!.cards).toEqual({ 'card-1': mockCard });
    expect(result!.cardIndexMeta).toEqual({ 'card-1': mockMeta });
  });

  it('should handle empty v1 arrays', () => {
    const bundle: CourseBundleV1 = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      course: { courses: [mockCourse], programs: [], lessons: [] },
      scenarios: [],
      cards: [],
      cardIndexMeta: {},
    };

    const result = extractEntitiesFromBundle(bundle);

    expect(result).not.toBeNull();
    expect(Object.keys(result!.courses)).toHaveLength(1);
    expect(result!.programs).toEqual({});
    expect(result!.lessons).toEqual({});
    expect(result!.scenarios).toEqual({});
    expect(result!.cards).toEqual({});
    expect(result!.cardIndexMeta).toEqual({});
  });
});

// ── Unknown format ──

describe('extractEntitiesFromBundle — unknown format', () => {
  it('should return null for unknown formatVersion', () => {
    const bundle = { formatVersion: 99 } as unknown as Parameters<
      typeof extractEntitiesFromBundle
    >[0];

    const result = extractEntitiesFromBundle(bundle);

    expect(result).toBeNull();
  });

  it('should return null for missing formatVersion', () => {
    const bundle = {} as unknown as Parameters<typeof extractEntitiesFromBundle>[0];

    const result = extractEntitiesFromBundle(bundle);

    expect(result).toBeNull();
  });
});
