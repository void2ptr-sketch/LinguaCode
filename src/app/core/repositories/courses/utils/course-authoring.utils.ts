import type { CourseAuthoring, CourseAuthoringStatus } from '../../../models/course-authoring.types';
import { COURSE_AUTHORING_STATUSES } from '../../../models/course-authoring.types';

/** Maximum allowed length (in characters) for a course idea string. */
export const COURSE_IDEA_MAX_LENGTH = 16_000;

/**
 * Creates a fresh, empty `CourseAuthoring` record with a blank idea and `draft` status.
 */
export function emptyCourseAuthoring(): CourseAuthoring {
  return {
    idea: '',
    status: 'draft',
  };
}

/**
 * Type guard that checks whether `value` is a valid `CourseAuthoringStatus`.
 */
export function isCourseAuthoringStatus(value: string): value is CourseAuthoringStatus {
  return (COURSE_AUTHORING_STATUSES as readonly string[]).includes(value);
}

/**
 * Normalises a `CourseAuthoring` record, returning `undefined` when the record is effectively empty.
 *
 * Ensures that `idea` is a non-null string, `status` is a recognised value (defaulting to `'draft'`),
 * and strips fields that are irrelevant for a blank draft.
 */
export function normalizeCourseAuthoring(
  authoring: CourseAuthoring | undefined,
): CourseAuthoring | undefined {
  if (!authoring) {
    return undefined;
  }

  const idea = authoring.idea ?? '';
  const status = isCourseAuthoringStatus(authoring.status) ? authoring.status : 'draft';

  if (!idea.trim() && status === 'draft' && !authoring.materializedAt && !authoring.lastError) {
    return undefined;
  }

  return {
    idea,
    status,
    ideaUpdatedAt: authoring.ideaUpdatedAt,
    materializedAt: authoring.materializedAt,
    lastError: authoring.lastError,
  };
}

/**
 * Returns a new `CourseAuthoring` with the supplied `idea` applied.
 *
 * If the trimmed idea differs from the previous one the status is reset to `'draft'` (unless the
 * existing status is already `'materialized'`, in which case it is also downgraded to `'draft'`) and
 * `ideaUpdatedAt` is refreshed.
 */
export function courseAuthoringWithIdea(authoring: CourseAuthoring, idea: string): CourseAuthoring {
  const trimmed = idea.trim();
  const previousIdea = authoring.idea.trim();

  if (trimmed === previousIdea) {
    return { ...authoring, idea };
  }

  return {
    ...authoring,
    idea,
    ideaUpdatedAt: new Date().toISOString(),
    status: authoring.status === 'materialized' ? 'draft' : authoring.status,
  };
}

/**
 * Compares two `CourseAuthoring` values for structural equality.
 *
 * Both values are normalised before comparison, so `undefined` inputs are treated as empty objects.
 */
export function sameCourseAuthoring(
  left: CourseAuthoring | undefined,
  right: CourseAuthoring | undefined,
): boolean {
  return (
    JSON.stringify(normalizeCourseAuthoring(left) ?? null) ===
    JSON.stringify(normalizeCourseAuthoring(right) ?? null)
  );
}
