import {
  normalizeStoredCourse,
  normalizeStoredLesson,
  normalizeStoredProgram,
  mergeStoredCourse,
  mergeStoredLesson,
  normalizeStoredCourseCatalog,
  cloneCourseCatalog,
  isNestedFormat,
  normalizeNestedCourseCatalog,
} from './course-catalog-state';
import type { Course, Lesson } from '../model';
import type { Program } from '../../program/model';
import type { CoursesNestedFixture } from '../../content-seed/content-seed.types';

function makeCourse(overrides?: Partial<Course>): Course {
  return {
    id: 'c1',
    title: 'Test Course',
    description: 'Description',
    authorId: 'local-user',
    languagePair: { known: 'ru', learning: 'zh' },
    programIds: ['p1'],
    published: false,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Course;
}

function makeProgram(overrides?: Partial<Program>): Program {
  return {
    id: 'p1',
    courseId: 'c1',
    title: 'Test Program',
    description: 'Program desc',
    lessonIds: ['l1'],
    order: 0,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Program;
}

function makeLesson(overrides?: Partial<Lesson>): Lesson {
  return {
    id: 'l1',
    programId: 'p1',
    title: 'Test Lesson',
    description: 'Lesson desc',
    scenarioIds: ['s1'],
    prerequisiteLessonIds: [],
    order: 0,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Lesson;
}

describe('course-catalog-state', () => {
  describe('normalizeStoredCourse', () => {
    it('should fill missing description with empty string', () => {
      const course = makeCourse({ description: undefined as unknown as string });
      const result = normalizeStoredCourse(course);
      expect(result.description).toBe('');
    });

    it('should fill missing authorId with local-user', () => {
      const course = makeCourse({ authorId: undefined as unknown as string });
      const result = normalizeStoredCourse(course);
      expect(result.authorId).toBe('local-user');
    });

    it('should clone programIds array', () => {
      const programIds = ['p1', 'p2'];
      const course = makeCourse({ programIds });
      const result = normalizeStoredCourse(course);
      expect(result.programIds).not.toBe(programIds);
      expect(result.programIds).toEqual(programIds);
    });

    it('should default published to false', () => {
      const course = makeCourse({ published: undefined as unknown as boolean });
      const result = normalizeStoredCourse(course);
      expect(result.published).toBe(false);
    });

    it('should default updatedAt to epoch ISO', () => {
      const course = makeCourse({ updatedAt: undefined as unknown as string });
      const result = normalizeStoredCourse(course);
      expect(result.updatedAt).toBe(new Date(0).toISOString());
    });

    it('should preserve existing values when all fields are present', () => {
      const course = makeCourse();
      const result = normalizeStoredCourse(course);
      expect(result.id).toBe('c1');
      expect(result.title).toBe('Test Course');
      expect(result.published).toBe(false);
    });
  });

  describe('normalizeStoredProgram', () => {
    it('should clone lessonIds array', () => {
      const lessonIds = ['l1', 'l2'];
      const program = makeProgram({ lessonIds });
      const result = normalizeStoredProgram(program);
      expect(result.lessonIds).not.toBe(lessonIds);
      expect(result.lessonIds).toEqual(lessonIds);
    });
  });

  describe('normalizeStoredLesson', () => {
    it('should clone scenarioIds array', () => {
      const scenarioIds = ['s1', 's2'];
      const lesson = makeLesson({ scenarioIds });
      const result = normalizeStoredLesson(lesson);
      expect(result.scenarioIds).not.toBe(scenarioIds);
      expect(result.scenarioIds).toEqual(scenarioIds);
    });

    it('should clone prerequisiteLessonIds array', () => {
      const prereqs = ['l0'];
      const lesson = makeLesson({ prerequisiteLessonIds: prereqs });
      const result = normalizeStoredLesson(lesson);
      expect(result.prerequisiteLessonIds).not.toBe(prereqs);
      expect(result.prerequisiteLessonIds).toEqual(prereqs);
    });

    it('should default missing prerequisiteLessonIds to empty array', () => {
      const lesson = makeLesson({ prerequisiteLessonIds: undefined as unknown as string[] });
      const result = normalizeStoredLesson(lesson);
      expect(result.prerequisiteLessonIds).toEqual([]);
    });
  });

  describe('mergeStoredCourse', () => {
    it('should normalize stored course when no default provided', () => {
      const stored = makeCourse({ title: 'Custom' });
      const result = mergeStoredCourse(stored, undefined);
      expect(result.title).toBe('Custom');
      expect(result.description).toBe('Description');
    });

    it('should prefer stored values over defaults', () => {
      const stored = makeCourse({ title: 'Custom Title', description: 'Custom Desc' });
      const defaults = makeCourse({ title: 'Default Title' });
      const result = mergeStoredCourse(stored, defaults);
      expect(result.title).toBe('Custom Title');
      expect(result.description).toBe('Custom Desc');
    });

    it('should always use default languagePair', () => {
      const stored = makeCourse({
        languagePair: { known: 'en', learning: 'zh' } as Course['languagePair'],
      });
      const defaults = makeCourse({ languagePair: { known: 'ru', learning: 'zh' } });
      const result = mergeStoredCourse(stored, defaults);
      expect(result.languagePair).toEqual({ known: 'ru', learning: 'zh' });
    });

    it('should use stored programIds when non-empty', () => {
      const stored = makeCourse({ programIds: ['custom-p1', 'custom-p2'] });
      const defaults = makeCourse({ programIds: ['default-p1'] });
      const result = mergeStoredCourse(stored, defaults);
      expect(result.programIds).toEqual(['custom-p1', 'custom-p2']);
    });

    it('should use default programIds when stored is empty', () => {
      const stored = makeCourse({ programIds: [] });
      const defaults = makeCourse({ programIds: ['default-p1'] });
      const result = mergeStoredCourse(stored, defaults);
      expect(result.programIds).toEqual(['default-p1']);
    });
  });

  describe('mergeStoredLesson', () => {
    it('should normalize stored lesson when no default provided', () => {
      const stored = makeLesson({ title: 'Custom Lesson' });
      const result = mergeStoredLesson(stored, undefined);
      expect(result.title).toBe('Custom Lesson');
    });

    it('should prefer stored values over defaults', () => {
      const stored = makeLesson({ title: 'Custom Title' });
      const defaults = makeLesson({ title: 'Default Title' });
      const result = mergeStoredLesson(stored, defaults);
      expect(result.title).toBe('Custom Title');
    });

    it('should use stored scenarioIds when non-empty', () => {
      const stored = makeLesson({ scenarioIds: ['custom-s1'] });
      const defaults = makeLesson({ scenarioIds: ['default-s1'] });
      const result = mergeStoredLesson(stored, defaults);
      expect(result.scenarioIds).toEqual(['custom-s1']);
    });

    it('should use default scenarioIds when stored is empty', () => {
      const stored = makeLesson({ scenarioIds: [] });
      const defaults = makeLesson({ scenarioIds: ['default-s1'] });
      const result = mergeStoredLesson(stored, defaults);
      expect(result.scenarioIds).toEqual(['default-s1']);
    });

    it('should use stored prerequisiteLessonIds when non-empty', () => {
      const stored = makeLesson({ prerequisiteLessonIds: ['prereq-l1'] });
      const defaults = makeLesson({ prerequisiteLessonIds: ['default-prereq'] });
      const result = mergeStoredLesson(stored, defaults);
      expect(result.prerequisiteLessonIds).toEqual(['prereq-l1']);
    });
  });

  describe('normalizeStoredCourseCatalog', () => {
    it('should return empty catalog for invalid input', () => {
      const result = normalizeStoredCourseCatalog({});
      expect(result.courses).toEqual([]);
      expect(result.programs).toEqual([]);
      expect(result.lessons).toEqual([]);
    });

    it('should filter out invalid courses, programs and lessons', () => {
      const catalog = normalizeStoredCourseCatalog({
        courses: [
          makeCourse({ title: 'Valid' }),
          { id: 'invalid' } as unknown as Course,
          'not-an-object' as unknown as Course,
          null as unknown as Course,
        ],
        programs: [
          makeProgram({ title: 'Valid Program' }),
          { id: 'invalid' } as unknown as Program,
        ],
        lessons: [makeLesson({ title: 'Valid Lesson' }), { id: 'invalid' } as unknown as Lesson],
      });
      expect(catalog.courses).toHaveLength(1);
      expect(catalog.programs).toHaveLength(1);
      expect(catalog.lessons).toHaveLength(1);
    });

    it('should normalize valid courses, programs and lessons', () => {
      const catalog = normalizeStoredCourseCatalog({
        courses: [makeCourse()],
        programs: [makeProgram()],
        lessons: [makeLesson()],
      });
      expect(catalog.courses).toHaveLength(1);
      expect(catalog.courses[0].description).toBe('Description');
      expect(catalog.courses[0].authorId).toBe('local-user');
      expect(catalog.programs).toHaveLength(1);
      expect(catalog.lessons).toHaveLength(1);
    });

    it('should handle non-array courses, programs and lessons', () => {
      const catalog = normalizeStoredCourseCatalog({
        courses: 'not-an-array' as unknown as Course[],
        programs: 'not-an-array' as unknown as Program[],
        lessons: 123 as unknown as Lesson[],
      });
      expect(catalog.courses).toEqual([]);
      expect(catalog.programs).toEqual([]);
      expect(catalog.lessons).toEqual([]);
    });
  });

  describe('cloneCourseCatalog', () => {
    it('should return a deep clone with normalized courses, programs and lessons', () => {
      const catalog = {
        courses: [makeCourse({ title: 'Original' })],
        programs: [makeProgram({ title: 'Original Program' })],
        lessons: [makeLesson({ title: 'Original Lesson' })],
      };
      const cloned = cloneCourseCatalog(catalog);

      expect(cloned).not.toBe(catalog);
      expect(cloned.courses).not.toBe(catalog.courses);
      expect(cloned.programs).not.toBe(catalog.programs);
      expect(cloned.lessons).not.toBe(catalog.lessons);
      expect(cloned.courses[0]).not.toBe(catalog.courses[0]);
      expect(cloned.programs[0]).not.toBe(catalog.programs[0]);
      expect(cloned.lessons[0]).not.toBe(catalog.lessons[0]);
    });

    it('should not be affected by mutations to the original catalog', () => {
      const catalog = {
        courses: [makeCourse({ title: 'Original' })],
        programs: [],
        lessons: [],
      };
      const cloned = cloneCourseCatalog(catalog);

      catalog.courses[0].title = 'Modified';

      expect(cloned.courses[0].title).toBe('Original');
    });
  });

  describe('isNestedFormat', () => {
    it('should return true for nested format (programs array, no courses)', () => {
      const nested = { programs: [{ id: 'p1', title: 'P', description: '', order: 0, lessons: [] }] };
      expect(isNestedFormat(nested as unknown as Partial<Course[]>)).toBe(true);
    });

    it('should return false for legacy format (courses array present)', () => {
      const legacy = { courses: [{ id: 'c1', title: 'C', programIds: [] }] };
      expect(isNestedFormat(legacy as unknown as Partial<Course[]>)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isNestedFormat({} as unknown as Partial<Course[]>)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNestedFormat(null as unknown as Partial<Course[]>)).toBe(false);
    });

    it('should return false when both programs and courses are arrays', () => {
      const mixed = {
        programs: [{ id: 'p1', title: 'P', description: '', order: 0, lessons: [] }],
        courses: [{ id: 'c1', title: 'C', programIds: [] }],
      };
      expect(isNestedFormat(mixed as unknown as Partial<Course[]>)).toBe(false);
    });
  });

  describe('normalizeNestedCourseCatalog', () => {
    function makeNestedFixture(overrides?: Partial<CoursesNestedFixture>): CoursesNestedFixture {
      return {
        id: 'course-nested-1',
        title: 'Nested Course',
        description: 'A nested course for testing',
        languagePair: { known: 'ru', learning: 'en' },
        published: true,
        authoring: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: 'First program',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: 'First lesson',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-1',
                    title: 'Scenario 1',
                    description: 'First scenario',
                    order: 0,
                    published: true,
                    cards: [
                      {
                        id: 'card-1',
                        kind: 'select',
                        title: 'Card 1',
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

    it('should return a catalog with one course, one program, one lesson', () => {
      const fixture = makeNestedFixture();
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.courses).toHaveLength(1);
      expect(result.catalog.courses[0].id).toBe('course-nested-1');
      expect(result.catalog.courses[0].title).toBe('Nested Course');
      expect(result.catalog.programs).toHaveLength(1);
      expect(result.catalog.programs[0].id).toBe('program-1');
      expect(result.catalog.programs[0].courseId).toBe('course-nested-1');
      expect(result.catalog.lessons).toHaveLength(1);
      expect(result.catalog.lessons[0].id).toBe('lesson-1');
      expect(result.catalog.lessons[0].programId).toBe('program-1');
    });

    it('should assign programIds to the course', () => {
      const fixture = makeNestedFixture();
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.courses[0].programIds).toEqual(['program-1']);
    });

    it('should assign lessonIds to the program', () => {
      const fixture = makeNestedFixture();
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.programs[0].lessonIds).toEqual(['lesson-1']);
    });

    it('should create scenarios with cardSource from inline cards', () => {
      const fixture = makeNestedFixture();
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.lessons[0].scenarioIds).toHaveLength(1);
      // Scenarios are not directly returned in catalog — they are stored separately
      // The cards should be in the cards array
    });

    it('should extract cards and assign courseId/lessonId/scenarioId', () => {
      const fixture = makeNestedFixture();
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].id).toBe('card-1');
      expect((result.cards[0] as { courseId?: string }).courseId).toBe('course-nested-1');
      expect((result.cards[0] as { lessonId?: string }).lessonId).toBe('lesson-1');
    });

    it('should handle multiple programs, lessons, and scenarios', () => {
      const fixture = makeNestedFixture({
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: '',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-1',
                    title: 'Scenario 1',
                    description: '',
                    order: 0,
                    published: true,
                    cards: [{ id: 'card-1', kind: 'select', title: 'C1', appearance: { theme: 'a', fontSize: 'md' }, direction: 'known-to-learning' as const, promptKnown: 'a', optionsLearning: ['b'], correctIndex: 0 }],
                  },
                  {
                    id: 'scenario-2',
                    title: 'Scenario 2',
                    description: '',
                    order: 1,
                    published: true,
                    cards: [{ id: 'card-2', kind: 'flip', title: 'C2', appearance: { theme: 'a', fontSize: 'md' }, front: 'a', back: 'b' }],
                  },
                ],
              },
            ],
          },
          {
            id: 'program-2',
            title: 'Program 2',
            description: '',
            order: 1,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-2',
                title: 'Lesson 2',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-3',
                    title: 'Scenario 3',
                    description: '',
                    order: 0,
                    published: true,
                    cards: [{ id: 'card-3', kind: 'select', title: 'C3', appearance: { theme: 'a', fontSize: 'md' }, direction: 'known-to-learning' as const, promptKnown: 'c', optionsLearning: ['d'], correctIndex: 0 }],
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.courses).toHaveLength(1);
      expect(result.catalog.programs).toHaveLength(2);
      expect(result.catalog.lessons).toHaveLength(2);
      expect(result.cards).toHaveLength(3);
      expect(result.catalog.courses[0].programIds).toEqual(['program-1', 'program-2']);
      expect(result.catalog.programs[0].lessonIds).toEqual(['lesson-1']);
      expect(result.catalog.programs[1].lessonIds).toEqual(['lesson-2']);
    });

    it('should handle empty cards array with _cardIds fallback', () => {
      const fixture = makeNestedFixture({
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: '',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-1',
                    title: 'Scenario 1',
                    description: '',
                    order: 0,
                    published: true,
                    cards: [],
                    _cardIds: ['external-card-1', 'external-card-2'],
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.cards).toHaveLength(0); // _cardIds are references, not full cards
      expect(result.catalog.lessons[0].scenarioIds).toHaveLength(1);
    });

    it('should handle scenarios without cards and without _cardIds', () => {
      const fixture = makeNestedFixture({
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: '',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: '',
                order: 0,
                prerequisiteLessonIds: [],
                scenarios: [
                  {
                    id: 'scenario-empty',
                    title: 'Empty Scenario',
                    description: '',
                    order: 0,
                    published: true,
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.cards).toHaveLength(0);
      expect(result.catalog.lessons[0].scenarioIds).toHaveLength(1);
    });

    it('should default missing description and published fields', () => {
      const fixture = makeNestedFixture({
        description: undefined as unknown as string,
        published: undefined as unknown as boolean,
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: undefined as unknown as string,
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: undefined as unknown as string,
                order: 0,
                prerequisiteLessonIds: undefined as unknown as string[],
                scenarios: [
                  {
                    id: 'scenario-1',
                    title: 'Scenario 1',
                    description: undefined as unknown as string,
                    order: 0,
                    published: undefined as unknown as boolean,
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.courses[0].description).toBe('');
      expect(result.catalog.courses[0].published).toBe(false);
      expect(result.catalog.programs[0].description).toBe('');
    });

    it('should preserve prerequisiteLessonIds', () => {
      const fixture = makeNestedFixture({
        programs: [
          {
            id: 'program-1',
            title: 'Program 1',
            description: '',
            order: 0,
            prerequisiteProgramIds: [],
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1',
                description: '',
                order: 0,
                prerequisiteLessonIds: ['lesson-0'],
                scenarios: [
                  {
                    id: 'scenario-1',
                    title: 'Scenario 1',
                    description: '',
                    order: 0,
                    published: true,
                  },
                ],
              },
            ],
          },
        ],
      });
      const result = normalizeNestedCourseCatalog(fixture);

      expect(result.catalog.lessons[0].prerequisiteLessonIds).toEqual(['lesson-0']);
    });
  });
});
