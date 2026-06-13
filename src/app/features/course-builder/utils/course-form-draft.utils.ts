import type { CourseWithLessons } from '../../../core/models';
import type { CourseWritePayload } from '../../../core/data/courses-api.service';
import type { CourseFormDraft, LessonFormDraft } from '../types';

export function lessonDraftKey(lesson: Pick<LessonFormDraft, 'id' | 'clientId'>): string {
  return lesson.id ?? lesson.clientId;
}

export const emptyLessonFormDraft = (order = 0): LessonFormDraft => ({
  clientId: crypto.randomUUID(),
  title: '',
  description: '',
  scenarioIds: [],
  prerequisiteLessonIds: [],
  order,
});

export const emptyCourseFormDraft = (): CourseFormDraft => ({
  title: '',
  description: '',
  published: false,
  lessons: [emptyLessonFormDraft(0)],
});

export function courseToFormDraft(course: CourseWithLessons): CourseFormDraft {
  return {
    title: course.title,
    description: course.description,
    published: course.published,
    lessons: course.lessons
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
  };
}

export function formDraftToCourseWritePayload(draft: CourseFormDraft): CourseWritePayload {
  const keyToPersistedId = new Map<string, string>();

  for (const lesson of draft.lessons) {
    keyToPersistedId.set(lessonDraftKey(lesson), lesson.id ?? lesson.clientId);
  }

  return {
    title: draft.title,
    description: draft.description,
    published: draft.published,
    lessons: draft.lessons.map((lesson, index) => {
      const ownKey = lessonDraftKey(lesson);
      const prerequisiteLessonIds = lesson.prerequisiteLessonIds
        .map((key) => keyToPersistedId.get(key) ?? key)
        .filter((id) => id !== keyToPersistedId.get(ownKey));

      return {
        id: lesson.id ?? lesson.clientId,
        title: lesson.title,
        description: lesson.description,
        scenarioIds: lesson.scenarioIds,
        prerequisiteLessonIds,
        order: lesson.order ?? index,
      };
    }),
  };
}

export function serializeCourseFormDraft(draft: CourseFormDraft): string {
  return JSON.stringify(draft);
}
