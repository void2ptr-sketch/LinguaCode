import type { Card } from '../../models';
import type { Course, Lesson } from '../../models';
import type { Scenario } from '../../models';
import type { CardIndexMetaOverride } from '../cards/card-index.mapper';

/**
 * A self-contained JSON package for exporting a course from localStorage to repository seed files.
 *
 * @remarks
 * Contains the course, lessons, scenarios, cards, and card index metadata in a single bundle.
 * Used for backup, migration, and content sharing between projects.
 * @see docs/COURSE-BUNDLE.md
 */
export type CourseBundle = {
  /** Always `1` for the current format version. */
  formatVersion: 1;
  /** ISO 8601 timestamp of the export. */
  exportedAt: string;
  /** Author ID from localStorage (typically 'local-user'). */
  sourceAuthorId?: string;
  /** The course program with its lessons. */
  course: {
    courses: Course[];
    lessons: Lesson[];
  };
  /** All scenarios referenced by the course's lessons. */
  scenarios: Scenario[];
  /** All cards referenced by the scenarios. */
  cards: Card[];
  /** Card index metadata for each card in the bundle. */
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};

/**
 * Result of validating a course bundle before export.
 *
 * @remarks
 * Used by `CourseBundleValidator` to check for missing references and data integrity issues.
 */
export type CourseBundleValidation = {
  /** Whether the bundle passed all validation checks. */
  valid: boolean;
  /** List of error messages if validation failed. */
  errors: readonly string[];
};

/**
 * Error that blocks course bundle export.
 *
 * @remarks
 * Error codes: `criteria-scenario` — criteria-based card source not supported;
 * `missing-lesson` — lesson not found in bundle; `missing-scenario` — scenario not found;
 * `missing-card` — card not found; `missing-meta` — card index meta not found.
 */
export type CourseBundleError = {
  /** Error code identifying the type of validation failure. */
  code:
    | 'criteria-scenario'
    | 'missing-lesson'
    | 'missing-scenario'
    | 'missing-card'
    | 'missing-meta';
  /** Human-readable error message. */
  message: string;
  /** ID of the entity that caused the error. */
  entityId: string;
};
