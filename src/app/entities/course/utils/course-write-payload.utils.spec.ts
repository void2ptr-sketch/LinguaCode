import { describe, expect, it } from 'vitest';

import type { CourseWithPrograms } from '../model';
import type { CourseWritePayload, LessonWritePayload } from '../repository/course-catalog.port';
import {
  appendScenarioToLessonPayload,
  courseWithProgramsToWritePayload,
  removeScenarioFromLessonPayload,
} from './course-write-payload.utils';

function createCourse(): CourseWithPrograms {
  return {
    id: 'course-1',
    title: 'Course',
    description: 'Desc',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'en' },
    programIds: ['p1', 'p2'],
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    authoring: { idea: 'Идея курса', status: 'draft', lastError: null },
    practiceSettings: { mode: 'guided' },
    programs: [
      {
        id: 'p2',
        courseId: 'course-1',
        title: 'Program 2',
        description: '',
        lessonIds: ['l3'],
        order: 2,
        updatedAt: '2026-01-01T00:00:00.000Z',
        lessons: [
          {
            id: 'l3',
            programId: 'p2',
            title: 'Lesson 3',
            description: '',
            scenarioIds: ['s2'],
            prerequisiteLessonIds: [],
            order: 0,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        id: 'p1',
        courseId: 'course-1',
        title: 'Program 1',
        description: '',
        lessonIds: ['l1', 'l2'],
        order: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
        lessons: [
          {
            id: 'l2',
            programId: 'p1',
            title: 'Lesson 2',
            description: '',
            scenarioIds: [],
            prerequisiteLessonIds: ['l1'],
            order: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'l1',
            programId: 'p1',
            title: 'Lesson 1',
            description: 'Описание',
            scenarioIds: ['s1'],
            prerequisiteLessonIds: ['l1', 'l2'],
            order: 0,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ],
  };
}

describe('courseWithProgramsToWritePayload', () => {
  it('maps course fields without normalizeDraft validations', () => {
    const payload = courseWithProgramsToWritePayload(createCourse());

    expect(payload).toMatchObject({
      title: 'Course',
      description: 'Desc',
      published: true,
      languagePair: { known: 'ru', learning: 'en' },
      authoringStatus: 'draft',
      authoringIdea: 'Идея курса',
      practiceSettings: { mode: 'guided' },
    });
  });

  it('keeps a lesson without scenarios (no «≥ 1 сценарий» validation)', () => {
    const payload = courseWithProgramsToWritePayload(createCourse());

    const lesson2 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l2');
    expect(lesson2?.scenarioIds).toEqual([]);
  });

  it('sorts programs and lessons by order', () => {
    const payload = courseWithProgramsToWritePayload(createCourse());

    expect(payload.programs.map((program) => program.id)).toEqual(['p1', 'p2']);
    expect(payload.programs[0].lessons?.map((lesson) => lesson.id)).toEqual(['l1', 'l2']);
  });

  it('maps program/lesson payload fields', () => {
    const payload = courseWithProgramsToWritePayload(createCourse());

    const program1 = payload.programs[0];
    expect(program1.courseId).toBe('course-1');
    expect(program1.lessonIds).toEqual(['l1', 'l2']);

    const lesson1 = program1.lessons?.[0] as LessonWritePayload;
    expect(lesson1).toMatchObject({
      id: 'l1',
      programId: 'p1',
      title: 'Lesson 1',
      description: 'Описание',
      scenarioIds: ['s1'],
      order: 0,
    });
  });

  it('filters self-referencing prerequisite lesson IDs', () => {
    const payload = courseWithProgramsToWritePayload(createCourse());

    const lesson1 = payload.programs[0].lessons?.[0] as LessonWritePayload;
    expect(lesson1.prerequisiteLessonIds).toEqual(['l2']);
  });

  it('copies nested arrays instead of keeping references', () => {
    const course = createCourse();
    const payload = courseWithProgramsToWritePayload(course);

    const lesson1 = payload.programs[0].lessons?.[0] as LessonWritePayload;
    // Маппер сортирует программы/уроки по `order`, поэтому исходный урок
    // ищем по id, а не по индексу в неотсортированном фикстурном массиве.
    const sourceLesson1 = course.programs
      .find((program) => program.id === 'p1')
      ?.lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1.scenarioIds).not.toBe(sourceLesson1?.scenarioIds);
    const mutated = [...lesson1.scenarioIds, 'mutated'];
    expect(mutated).toEqual(['s1', 'mutated']);
    expect(sourceLesson1?.scenarioIds).toEqual(['s1']);
  });

  it('omits optional authoring/practiceSettings when absent', () => {
    const course = createCourse();
    delete (course as Partial<CourseWithPrograms>).authoring;
    delete (course as Partial<CourseWithPrograms>).practiceSettings;

    const payload = courseWithProgramsToWritePayload(course);

    expect(payload.authoringStatus).toBeUndefined();
    expect(payload.authoringIdea).toBeUndefined();
    expect(payload.practiceSettings).toBeUndefined();
  });
});

describe('appendScenarioToLessonPayload', () => {
  function createPayload(): CourseWritePayload {
    return courseWithProgramsToWritePayload(createCourse());
  }

  it('appends the scenario ID to the target lesson', () => {
    const payload = appendScenarioToLessonPayload(createPayload(), 'l2', 's-new');

    const lesson2 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l2');
    expect(lesson2?.scenarioIds).toEqual(['s-new']);
    // другие уроки не затронуты
    const lesson1 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual(['s1']);
  });

  it('dedupes: does not append an already-bound scenario ID', () => {
    const payload = appendScenarioToLessonPayload(createPayload(), 'l1', 's1');

    const lesson1 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual(['s1']);
  });

  it('preserves existing scenario order when appending', () => {
    const payload = appendScenarioToLessonPayload(createPayload(), 'l1', 's-new');

    const lesson1 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual(['s1', 's-new']);
  });

  it('returns the payload unchanged when the lesson is missing', () => {
    const payload = createPayload();
    const result = appendScenarioToLessonPayload(payload, 'missing-lesson', 's-new');

    expect(result).toBe(payload);
  });

  it('does not mutate the source payload', () => {
    const payload = createPayload();
    const result = appendScenarioToLessonPayload(payload, 'l2', 's-new');

    expect(result).not.toBe(payload);
    const lesson2 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l2');
    expect(lesson2?.scenarioIds).toEqual([]);
  });
});

describe('removeScenarioFromLessonPayload', () => {
  function createPayload(): CourseWritePayload {
    return courseWithProgramsToWritePayload(createCourse());
  }

  it('removes the scenario ID from the target lesson (cascade after deletion)', () => {
    const payload = removeScenarioFromLessonPayload(createPayload(), 'l1', 's1');

    const lesson1 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual([]);
    // другие уроки не затронуты
    const lesson3 = payload.programs[1].lessons?.find((lesson) => lesson.id === 'l3');
    expect(lesson3?.scenarioIds).toEqual(['s2']);
  });

  it('preserves the order of the remaining scenario IDs', () => {
    const payload = appendScenarioToLessonPayload(createPayload(), 'l1', 's-new');
    const result = removeScenarioFromLessonPayload(payload, 'l1', 's1');

    const lesson1 = result.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual(['s-new']);
  });

  it('is idempotent: returns the payload unchanged when the scenario is not bound', () => {
    const payload = createPayload();
    const result = removeScenarioFromLessonPayload(payload, 'l2', 's1');

    expect(result).toBe(payload);
  });

  it('returns the payload unchanged when the lesson is missing', () => {
    const payload = createPayload();
    const result = removeScenarioFromLessonPayload(payload, 'missing-lesson', 's1');

    expect(result).toBe(payload);
  });

  it('does not mutate the source payload', () => {
    const payload = createPayload();
    const result = removeScenarioFromLessonPayload(payload, 'l1', 's1');

    expect(result).not.toBe(payload);
    const lesson1 = payload.programs[0].lessons?.find((lesson) => lesson.id === 'l1');
    expect(lesson1?.scenarioIds).toEqual(['s1']);
  });
});
