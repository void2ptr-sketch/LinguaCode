/**
 * Status of the course authoring pipeline: idea → plan → materialization into lessons/scenarios/cards.
 */
export type CourseAuthoringStatus = 'draft' | 'planned' | 'generating' | 'materialized' | 'failed';

/**
 * Authoring layer for a course: contains the author's idea text and pipeline status.
 *
 * @remarks
 * This data is not shown to students in the course catalog. It is used by the course
 * generator to create lessons, scenarios, and cards from the author's idea.
 */
export type CourseAuthoring = {
  /** Free-text description of the course idea — the basis for structure generation. */
  idea: string;
  status: CourseAuthoringStatus;
  /** ISO 8601 timestamp of the last idea modification. */
  ideaUpdatedAt?: string;
  /** ISO 8601 timestamp of the last materialization (manual or automated). */
  materializedAt?: string;
  /** Last generation error message (present when `status === 'failed'`). */
  lastError?: string;
};

export const COURSE_AUTHORING_STATUSES: readonly CourseAuthoringStatus[] = [
  'draft',
  'planned',
  'generating',
  'materialized',
  'failed',
] as const;
