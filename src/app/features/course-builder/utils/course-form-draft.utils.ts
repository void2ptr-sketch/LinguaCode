import type { ProgramWithLessons } from '../../../entities/program/model/program.types';
import type {
  CourseWritePayload,
  ProgramWritePayload,
} from '../../../entities/course/api/courses-api.service';
import type { Course } from '../../../entities/course/model';
import {
  emptyCourseAuthoring,
  normalizeCourseAuthoring,
} from '../../../entities/course/utils/course-authoring.utils';
import type { CourseFormDraft, ProgramFormDraft, LessonFormDraft } from '../types';

export function lessonDraftKey(lesson: Pick<LessonFormDraft, 'id' | 'clientId'>): string {
  return lesson.id ?? lesson.clientId;
}

export function programDraftKey(program: { id?: string; clientId: string }): string {
  return program.id ?? program.clientId;
}

export const emptyLessonFormDraft = (order = 0): LessonFormDraft => ({
  clientId: crypto.randomUUID(),
  title: '',
  description: '',
  scenarioIds: [],
  prerequisiteLessonIds: [],
  order,
});

export const emptyProgramFormDraft = (order = 0): ProgramFormDraft => ({
  clientId: crypto.randomUUID(),
  title: '',
  description: '',
  lessons: [emptyLessonFormDraft(0)],
  order,
});

export const emptyCourseFormDraft = (): CourseFormDraft => ({
  title: '',
  description: '',
  published: true,
  authoring: emptyCourseAuthoring(),
  programs: [emptyProgramFormDraft(0)],
});

export function courseToFormDraft(
  course: Course & { programs: readonly ProgramWithLessons[] },
): CourseFormDraft {
  return {
    title: course.title,
    description: course.description,
    published: course.published,
    authoring: course.authoring ?? emptyCourseAuthoring(),
    programs: course.programs
      .map((program) => ({
        clientId: program.id,
        id: program.id,
        title: program.title,
        description: program.description,
        lessons: program.lessons
          .map((lesson) => ({
            clientId: lesson.id,
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            scenarioIds: [...lesson.scenarioIds],
            prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
            order: lesson.order,
          }))
          .sort((left, right) => left.order - right.order),
        order: program.order,
      }))
      .sort((left, right) => left.order - right.order),
  };
}

export function formDraftToCourseWritePayload(draft: CourseFormDraft): CourseWritePayload {
  const programKeyToPersistedId = new Map<string, string>();
  const lessonKeyToPersistedId = new Map<string, string>();

  for (const program of draft.programs) {
    programKeyToPersistedId.set(programDraftKey(program), program.id ?? program.clientId);
  }

  for (const program of draft.programs) {
    for (const lesson of program.lessons) {
      lessonKeyToPersistedId.set(lessonDraftKey(lesson), lesson.id ?? lesson.clientId);
    }
  }

  const programs: ProgramWritePayload[] = draft.programs.map((program, pIndex) => {
    const programId = program.id ?? program.clientId;

    const lessons: import('../../../entities/course/repository/course-catalog.port').LessonWritePayload[] =
      program.lessons.map((lesson, lIndex) => {
        const ownLessonKey = lessonDraftKey(lesson);
        const prerequisiteLessonIds = lesson.prerequisiteLessonIds
          .map((key) => lessonKeyToPersistedId.get(key) ?? key)
          .filter((id) => id !== lessonKeyToPersistedId.get(ownLessonKey));

        return {
          id: lesson.id ?? lesson.clientId,
          programId,
          title: lesson.title,
          description: lesson.description,
          scenarioIds: lesson.scenarioIds,
          prerequisiteLessonIds,
          order: lesson.order ?? lIndex,
        };
      });

    return {
      id: program.id ?? program.clientId,
      courseId: '', // Will be set by the API service
      title: program.title,
      description: program.description,
      lessonIds: lessons.map((l) => l.id ?? ''),
      lessons,
      order: program.order ?? pIndex,
    };
  });

  return {
    title: draft.title,
    description: draft.description,
    published: draft.published,
    authoring: normalizeCourseAuthoring(draft.authoring),
    programs,
  };
}

export function serializeCourseFormDraft(draft: CourseFormDraft): string {
  return JSON.stringify(draft);
}
