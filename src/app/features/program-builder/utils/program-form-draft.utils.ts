import type { Program, ProgramRequiredTier } from '../../../entities/program/model';
import type { ProgramWritePayload } from '../../../entities/program/api/programs-api.service';
import { sanitizePlainText } from '../../../shared/security';
import type { ProgramFormDraft } from '../types';

/** Maximum length of the program title (backend contract: 1–200). */
export const PROGRAM_TITLE_MAX_LENGTH = 200;

/** Creates an empty program draft, optionally linked to a course. */
export const emptyProgramFormDraft = (courseId = ''): ProgramFormDraft => ({
  courseId,
  title: '',
  description: '',
  requiredTier: 'FREE' as ProgramRequiredTier,
});

/** Maps a persisted program to its editable draft representation. */
export function programToFormDraft(program: Program): ProgramFormDraft {
  const raw = program as Record<string, unknown>;
  return {
    id: program.id,
    courseId: program.courseId,
    title: program.title,
    description: program.description,
    order: program.order,
    requiredTier: (raw['requiredTier'] as ProgramRequiredTier | undefined) ?? 'FREE',
    languagePairId: raw['languagePairId'] as number | undefined,
    published: raw['published'] as boolean | undefined,
  };
}

/**
 * Serializes a draft to a stable string for dirty-state comparison.
 *
 * @remarks
 * Serializes an explicit field set (not `JSON.stringify(draft)`) so that
 * extra properties can never leak into the snapshot comparison.
 */
export function serializeProgramFormDraft(draft: ProgramFormDraft): string {
  return JSON.stringify({
    id: draft.id,
    courseId: draft.courseId,
    title: draft.title,
    description: draft.description,
    order: draft.order,
    requiredTier: draft.requiredTier,
    languagePairId: draft.languagePairId,
    published: draft.published,
  });
}

/** Normalizes the program title: trims, strips HTML/control chars, clamps to 200. */
export function normalizeProgramTitle(title: string): string {
  return sanitizePlainText(title, PROGRAM_TITLE_MAX_LENGTH);
}

/**
 * Validates a program draft.
 *
 * @returns `null` when the draft is valid, otherwise a human-readable error message.
 */
export function validateProgramFormDraft(draft: ProgramFormDraft): string | null {
  const title = draft.title.trim();

  if (!title) {
    return 'Укажите название программы';
  }

  if (title.length > PROGRAM_TITLE_MAX_LENGTH) {
    return `Название не должно превышать ${PROGRAM_TITLE_MAX_LENGTH} символов`;
  }

  return null;
}

/**
 * Builds the payload for creating a program.
 *
 * @remarks
 * The `description` field is mapped to `programDescription` by
 * `ProgramsApiService` (see {@link ProgramWritePayload}). `lessonIds` is not
 * editable in the dialog — the store passes the existing lesson composition.
 */
export function formDraftToProgramCreatePayload(
  draft: ProgramFormDraft,
  lessonIds: readonly string[] = [],
): ProgramWritePayload {
  return {
    courseId: draft.courseId,
    title: normalizeProgramTitle(draft.title),
    description: draft.description,
    lessonIds,
    order: draft.order ?? 0,
    requiredTier: draft.requiredTier,
    languagePairId: draft.languagePairId,
    published: draft.published,
  };
}

/**
 * Builds the payload for updating an existing program.
 *
 * @remarks
 * The `description` field is mapped to `programDescription` by
 * `ProgramsApiService` (see {@link ProgramWritePayload}). `lessonIds` must be
 * supplied by the caller (the store passes the loaded program's lesson list)
 * because the draft does not track lesson composition.
 */
export function formDraftToProgramUpdatePayload(
  draft: ProgramFormDraft,
  lessonIds: readonly string[] = [],
): ProgramWritePayload {
  return {
    id: draft.id,
    courseId: draft.courseId,
    title: normalizeProgramTitle(draft.title),
    description: draft.description,
    lessonIds,
    order: draft.order ?? 0,
    requiredTier: draft.requiredTier,
    languagePairId: draft.languagePairId,
    published: draft.published,
  };
}
