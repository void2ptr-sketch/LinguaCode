import { describe, expect, it } from 'vitest';

import type { CourseWithLessons } from '../../../core/models';
import type { CourseAuthoring } from '../../../core/models/course-authoring.types';
import {
  courseToFormDraft,
  emptyCourseFormDraft,
  emptyLessonFormDraft,
  formDraftToCourseWritePayload,
  lessonDraftKey,
  serializeCourseFormDraft,
} from './course-form-draft.utils';
import type { CourseFormDraft, LessonFormDraft } from '../types/course-builder.types';

describe('course-form-draft.utils', () => {
  const defaultAuthoring: CourseAuthoring = {
    idea: 'Test course idea',
    status: 'draft',
  };

  describe('lessonDraftKey', () => {
    it('should return id when available', () => {
      const lesson: Pick<LessonFormDraft, 'id' | 'clientId'> = {
        id: 'persisted-123',
        clientId: 'client-456',
      };
      expect(lessonDraftKey(lesson)).toBe('persisted-123');
    });

    it('should return clientId when id is absent', () => {
      const lesson: Pick<LessonFormDraft, 'id' | 'clientId'> = {
        clientId: 'client-789',
      } as Pick<LessonFormDraft, 'id' | 'clientId'>;
      expect(lessonDraftKey(lesson)).toBe('client-789');
    });
  });

  describe('emptyLessonFormDraft', () => {
    it('should create a lesson draft with default order 0', () => {
      const draft = emptyLessonFormDraft();
      expect(draft.title).toBe('');
      expect(draft.description).toBe('');
      expect(draft.scenarioIds).toEqual([]);
      expect(draft.prerequisiteLessonIds).toEqual([]);
      expect(draft.order).toBe(0);
      expect(draft.clientId).toBeDefined();
    });

    it('should accept custom order', () => {
      const draft = emptyLessonFormDraft(5);
      expect(draft.order).toBe(5);
    });

    it('should generate a unique clientId', () => {
      const draft1 = emptyLessonFormDraft();
      const draft2 = emptyLessonFormDraft();
      expect(draft1.clientId).not.toBe(draft2.clientId);
    });
  });

  describe('emptyCourseFormDraft', () => {
    it('should create a course draft with one empty lesson', () => {
      const draft = emptyCourseFormDraft();
      expect(draft.title).toBe('');
      expect(draft.description).toBe('');
      expect(draft.published).toBe(true);
      expect(draft.lessons).toHaveLength(1);
      expect(draft.lessons[0].title).toBe('');
      expect(draft.lessons[0].order).toBe(0);
    });

    it('should have non-empty authoring', () => {
      const draft = emptyCourseFormDraft();
      expect(draft.authoring).toBeDefined();
    });
  });

  describe('courseToFormDraft', () => {
    function createCourse(overrides?: Record<string, unknown>): CourseWithLessons {
      return {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        authorId: 'author-1',
        languagePair: 'en-zh',
        lessonIds: ['lesson-1', 'lesson-2'],
        published: true,
        updatedAt: '2024-01-01T00:00:00Z',
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            description: 'First lesson',
            scenarioIds: ['scenario-1', 'scenario-2'],
            prerequisiteLessonIds: [],
            order: 1,
            courseId: 'course-1',
          },
          {
            id: 'lesson-2',
            title: 'Lesson 2',
            description: 'Second lesson',
            scenarioIds: ['scenario-3'],
            prerequisiteLessonIds: ['lesson-1'],
            order: 2,
            courseId: 'course-1',
          },
        ],
        authoring: { ...defaultAuthoring },
        ...overrides,
      } as unknown as CourseWithLessons;
    }

    it('should convert a course to form draft preserving all fields', () => {
      const course = createCourse();
      const draft = courseToFormDraft(course);

      expect(draft.title).toBe('Test Course');
      expect(draft.description).toBe('Test Description');
      expect(draft.published).toBe(true);
      expect(draft.lessons).toHaveLength(2);
    });

    it('should sort lessons by order', () => {
      const course = createCourse({
        lessons: [
          {
            id: 'lesson-2',
            title: 'Lesson 2',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: [],
            order: 2,
            courseId: 'course-1',
          },
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: [],
            order: 1,
            courseId: 'course-1',
          },
        ],
      } as unknown as CourseWithLessons);

      const draft = courseToFormDraft(course);
      expect(draft.lessons[0].id).toBe('lesson-1');
      expect(draft.lessons[1].id).toBe('lesson-2');
    });

    it('should deep copy scenarioIds', () => {
      const course = createCourse();
      const draft = courseToFormDraft(course);

      expect(draft.lessons[0].scenarioIds).not.toBe(course.lessons[0].scenarioIds);
    });

    it('should deep copy prerequisiteLessonIds', () => {
      const course = createCourse();
      const draft = courseToFormDraft(course);

      expect(draft.lessons[1].prerequisiteLessonIds).not.toBe(
        course.lessons[1].prerequisiteLessonIds,
      );
    });

    it('should handle course without authoring', () => {
      const course = createCourse({ authoring: undefined });
      const draft = courseToFormDraft(course);

      expect(draft.authoring).toBeDefined();
    });
  });

  describe('formDraftToCourseWritePayload', () => {
    function createDraft(overrides?: Partial<CourseFormDraft>): CourseFormDraft {
      return {
        title: 'Test Course',
        description: 'Test Description',
        published: true,
        authoring: { ...defaultAuthoring },
        lessons: [
          {
            clientId: 'client-1',
            id: 'persisted-1',
            title: 'Lesson 1',
            description: 'First',
            scenarioIds: ['scenario-1'],
            prerequisiteLessonIds: [],
            order: 0,
          },
          {
            clientId: 'client-2',
            id: 'persisted-2',
            title: 'Lesson 2',
            description: 'Second',
            scenarioIds: ['scenario-2', 'scenario-3'],
            prerequisiteLessonIds: ['persisted-1'],
            order: 1,
          },
        ],
        ...overrides,
      } as CourseFormDraft;
    }

    it('should convert draft to write payload', () => {
      const draft = createDraft();
      const payload = formDraftToCourseWritePayload(draft);

      expect(payload.title).toBe('Test Course');
      expect(payload.description).toBe('Test Description');
      expect(payload.published).toBe(true);
      expect(payload.lessons).toHaveLength(2);
    });

    it('should map lesson ids correctly', () => {
      const draft = createDraft();
      const payload = formDraftToCourseWritePayload(draft);

      expect(payload.lessons[0].id).toBe('persisted-1');
      expect(payload.lessons[1].id).toBe('persisted-2');
    });

    it('should map prerequisite lesson ids using key-to-id map', () => {
      const draft = createDraft();
      const payload = formDraftToCourseWritePayload(draft);

      expect(payload.lessons[1].prerequisiteLessonIds).toContain('persisted-1');
    });

    it('should filter self-referencing prerequisites', () => {
      const draft = {
        title: 'Test Course',
        description: 'Test Description',
        published: true,
        authoring: { ...defaultAuthoring },
        lessons: [
          {
            clientId: 'client-1',
            id: 'persisted-1',
            title: 'Lesson 1',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: ['persisted-1'],
            order: 0,
          },
        ],
      } as CourseFormDraft;

      const payload = formDraftToCourseWritePayload(draft);
      expect(payload.lessons[0].prerequisiteLessonIds).toHaveLength(0);
    });

    it('should use clientId when id is absent', () => {
      const draft = {
        title: 'Test Course',
        description: 'Test Description',
        published: true,
        authoring: { ...defaultAuthoring },
        lessons: [
          {
            clientId: 'new-client-1',
            title: 'New Lesson',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: [],
            order: 0,
          },
        ],
      } as CourseFormDraft;

      const payload = formDraftToCourseWritePayload(draft);
      expect(payload.lessons[0].id).toBe('new-client-1');
    });

    it('should normalize authoring', () => {
      const draft = createDraft();
      const payload = formDraftToCourseWritePayload(draft);

      expect(payload.authoring).toBeDefined();
    });

    it('should handle empty lessons array', () => {
      const draft = {
        title: 'Test Course',
        description: 'Test Description',
        published: true,
        authoring: { ...defaultAuthoring },
        lessons: [],
      } as CourseFormDraft;
      const payload = formDraftToCourseWritePayload(draft);

      expect(payload.lessons).toEqual([]);
    });
  });

  describe('serializeCourseFormDraft', () => {
    it('should serialize draft to JSON string', () => {
      const draft: CourseFormDraft = {
        title: 'Test',
        description: 'Desc',
        published: true,
        authoring: { ...defaultAuthoring },
        lessons: [
          {
            clientId: 'client-1',
            id: 'id-1',
            title: 'Lesson',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: [],
            order: 0,
          },
        ],
      };

      const serialized = serializeCourseFormDraft(draft);
      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(parsed.title).toBe('Test');
      expect(parsed.lessons).toHaveLength(1);
    });

    it('should preserve all fields through serialization', () => {
      const draft: CourseFormDraft = {
        title: 'Course',
        description: 'Description',
        published: false,
        authoring: { ...defaultAuthoring },
        lessons: [
          {
            clientId: 'c1',
            title: 'L1',
            description: 'D1',
            scenarioIds: ['s1'],
            prerequisiteLessonIds: [],
            order: 0,
          },
        ],
      };

      const serialized = serializeCourseFormDraft(draft);
      const parsed = JSON.parse(serialized);

      expect(parsed.title).toBe('Course');
      expect(parsed.description).toBe('Description');
      expect(parsed.published).toBe(false);
    });
  });
});
