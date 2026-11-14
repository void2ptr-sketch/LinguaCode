import type { Lesson } from '../../../entities/course/model/lesson.types';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
} from '../../../entities/lesson/api/lessons-api.service';
import { sanitizePlainText } from '../../../shared/security';
import type { LessonFormDraft } from '../types';

/** Maximum length of the lesson title (backend contract: 1–200). */
export const LESSON_TITLE_MAX_LENGTH = 200;

/** Creates an empty lesson draft, optionally linked to a program. */
export const emptyLessonFormDraft = (programId = ''): LessonFormDraft => ({
  programId,
  title: '',
  description: '',
  order: 0,
  prerequisiteLessonIds: [],
});

/** Maps a persisted lesson to its editable draft representation. */
export function lessonToFormDraft(lesson: Lesson): LessonFormDraft {
  return {
    id: lesson.id,
    programId: lesson.programId,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    prerequisiteLessonIds: [...lesson.prerequisiteLessonIds],
  };
}

/**
 * Serializes a draft to a stable string for dirty-state comparison.
 *
 * @remarks
 * Serializes an explicit field set (not `JSON.stringify(draft)`) so that
 * extra properties can never leak into the snapshot comparison. Prerequisites
 * are sorted so that re-selecting in a different order is not "dirty".
 */
export function serializeLessonFormDraft(draft: LessonFormDraft): string {
  return JSON.stringify({
    id: draft.id,
    programId: draft.programId,
    title: draft.title,
    description: draft.description,
    order: draft.order,
    prerequisiteLessonIds: [...(draft.prerequisiteLessonIds ?? [])].sort(),
  });
}

/** Normalizes the lesson title: trims, strips HTML/control chars, clamps to 200. */
export function normalizeLessonTitle(title: string): string {
  return sanitizePlainText(title, LESSON_TITLE_MAX_LENGTH);
}

/**
 * Validates a lesson draft.
 *
 * @returns `null` when the draft is valid, otherwise a human-readable error message.
 */
export function validateLessonFormDraft(draft: LessonFormDraft): string | null {
  const title = draft.title.trim();

  if (!title) {
    return 'Укажите название урока';
  }

  if (title.length > LESSON_TITLE_MAX_LENGTH) {
    return `Название не должно превышать ${LESSON_TITLE_MAX_LENGTH} символов`;
  }

  if ((draft.order ?? 0) <= 0) {
    return 'Порядок должен быть больше нуля';
  }

  return null;
}

/**
 * Builds the payload for creating a lesson.
 *
 * @remarks
 * The `description` field is mapped to `lessonDescription` and
 * `prerequisiteLessonIds` is serialized as a raw JSON string by
 * `LessonsApiService` (see {@link LessonCreatePayload}).
 */
export function formDraftToLessonCreatePayload(draft: LessonFormDraft): LessonCreatePayload {
  return {
    programId: draft.programId,
    title: normalizeLessonTitle(draft.title),
    description: draft.description,
    order: draft.order ?? 0,
    prerequisiteLessonIds: [...(draft.prerequisiteLessonIds ?? [])],
  };
}

/**
 * Builds the payload for updating an existing lesson.
 *
 * @remarks
 * `programId` is immutable on update and therefore omitted (see
 * {@link LessonUpdatePayload}).
 */
export function formDraftToLessonUpdatePayload(draft: LessonFormDraft): LessonUpdatePayload {
  return {
    title: normalizeLessonTitle(draft.title),
    description: draft.description,
    order: draft.order ?? 0,
    prerequisiteLessonIds: [...(draft.prerequisiteLessonIds ?? [])],
  };
}
