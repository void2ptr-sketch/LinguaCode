import type { Course } from '../../model';
import type { Program } from '../../../program/model/program.types';
import type { Lesson } from '../../model/lesson.types';
import type { Scenario } from '../../../scenario/model';
import type { Card } from '../../../card/model';

/**
 * SCORM export bundle: a self-contained representation of a course
 * with its full hierarchy (Course → Program → Lesson → Scenario → Card)
 * and generated xAPI statements for analytics.
 *
 * @remarks
 * Used by both the real backend endpoint and the frontend mock interceptor.
 * The structure mirrors SCORM 2004 organization/item nesting while remaining
 * a plain JSON payload for development convenience.
 */
export type ScormExportBundle = {
  /** Format identifier and version for forward compatibility. */
  format: 'linguacode-scorm-export';
  /** Schema version. */
  version: number;
  /** ISO 8601 timestamp when the export was generated. */
  exportedAt: string;
  /** SCORM manifest describing the organization hierarchy. */
  manifest: ScormManifest;
  /** All courses referenced in the export. */
  courses: readonly Course[];
  /** All programs referenced in the export. */
  programs: readonly Program[];
  /** All lessons referenced in the export. */
  lessons: readonly Lesson[];
  /** All scenarios referenced in the export. */
  scenarios: readonly Scenario[];
  /** All cards referenced in the export. */
  cards: readonly Card[];
  /** Generated xAPI statements for learning analytics. */
  xapiStatements: readonly XapiStatement[];
};

/**
 * SCORM manifest describing the course organization hierarchy.
 *
 * @remarks
 * Maps to SCORM 2004's `organization` element with nested `item` elements.
 * Supports two levels: Program → Lesson, with cards as leaf resources.
 */
export type ScormManifest = {
  /** Unique identifier for the course export. */
  identifier: string;
  /** Display title of the course. */
  title: string;
  /** Description of the course. */
  description: string;
  /** SCORM organization items (one per program, in order). */
  organizations: readonly ScormOrganization[];
};

/**
 * A SCORM organization item representing a Program.
 *
 * @remarks
 * Contains nested lesson items. The `default` flag marks the primary
 * learning path presented to the LMS.
 */
export type ScormOrganization = {
  /** Unique identifier for this program organization. */
  identifier: string;
  /** Display title of the program. */
  title: string;
  /** Description of the program. */
  description: string;
  /** Whether this is the default learning path. */
  default: boolean;
  /** Display order within the course. */
  order: number;
  /** SCORM items representing lessons (nested). */
  items: readonly ScormLessonItem[];
};

/**
 * A SCORM lesson item containing card resources.
 *
 * @remarks
 * Each lesson maps to a SCORM `item` with child `resource` elements
 * for each card in the lesson's scenarios.
 */
export type ScormLessonItem = {
  /** Unique identifier for this lesson. */
  identifier: string;
  /** Display title of the lesson. */
  title: string;
  /** Description of the lesson. */
  description: string;
  /** Display order within the program. */
  order: number;
  /** SCORM resources representing cards (leaf nodes). */
  resources: readonly ScormResource[];
};

/**
 * A SCORM resource representing a single card.
 *
 * @remarks
 * Each card is a leaf resource with a JSON file reference.
 * The `type` field distinguishes card resources from other content types.
 */
export type ScormResource = {
  /** Unique resource identifier (prefixed with `res-`). */
  identifier: string;
  /** Content type: `card`, `scenario`, or `lesson`. */
  type: 'card' | 'scenario' | 'lesson';
  /** Relative path to the card/scenario data file. */
  href: string;
  /** Display title of the resource. */
  title: string;
};

/**
 * An xAPI (Tin Can API) statement for learning analytics.
 *
 * @remarks
 * xAPI statements record learning experiences and can be consumed
 * by Learning Record Stores (LRS) for analytics and reporting.
 * The mock uses `"system"` as the actor; production should use
 * the actual user identity.
 */
export type XapiStatement = {
  /** Unique statement identifier (UUID). */
  id: string;
  /** Actor who performed the action (typically a user or system). */
  actor: XapiActor;
  /** The verb describing the action (e.g., "experienced", "answered"). */
  verb: XapiVerb;
  /** The object of the action (card, lesson, course, etc.). */
  object: XapiObject;
  /** ISO 8601 timestamp when the action occurred. */
  timestamp: string;
  /** Context including parent course, program, and lesson references. */
  context: XapiContext;
};

/**
 * An xAPI actor representing a user or system.
 */
export type XapiActor = {
  /** Display name of the actor. */
  name: string;
  /** Email or identifier (mbox is the standard xAPI actor identifier). */
  mbox: string;
};

/**
 * An xAPI verb describing the action taken.
 */
export type XapiVerb = {
  /** Verb ID (ADI registry or custom URN). */
  id: string;
  /** Display name in the target language. */
  display: string;
};

/**
 * An xAPI object representing the target of the action.
 */
export type XapiObject = {
  /** Identifier URN (e.g., `urn:linguacode:card:radical-001`). */
  id: string;
  /** Object type: `activity`, `agent`, `group`, or `authority`. */
  objectType: 'activity' | 'agent' | 'group' | 'authority';
  /** Display name of the activity. */
  definition?: {
    /** Short name of the activity. */
    name: Record<string, string>;
    /** Description of the activity. */
    description?: Record<string, string>;
  };
};

/**
 * An xAPI context providing additional information about the statement.
 */
export type XapiContext = {
  /** Parent activities (course, program, lesson). */
  contextActivities?: {
    /** Category-level activities (e.g., course). */
    category?: XapiActivityRef[];
    /** Grouping-level activities (e.g., program, lesson). */
    grouping?: XapiActivityRef[];
  };
  /** Reverse activities (prerequisites, related content). */
  reverseActivityState?: XapiActivityRef[];
};

/**
 * A reference to an xAPI activity by URN.
 */
export type XapiActivityRef = {
  /** Activity identifier URN (e.g., `urn:linguacode:course:radicals-214`). */
  id: string;
};
