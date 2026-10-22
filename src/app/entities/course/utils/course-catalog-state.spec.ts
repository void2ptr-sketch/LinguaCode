import {
  normalizeStoredCourse,
  normalizeStoredLesson,
  normalizeStoredProgram,
  mergeStoredCourse,
  mergeStoredLesson,
  normalizeStoredCourseCatalog,
  cloneCourseCatalog,
} from './course-catalog-state';
import type { Course, Lesson } from '../model';
import type { Program } from '../../program/model';

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
});
