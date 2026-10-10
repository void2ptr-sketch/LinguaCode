/**
 * Status of a location node on the learning journey map.
 *
 * @remarks
 * `locked` — not yet accessible; `available` — ready to start; `in-progress` — partially completed;
 * `visited` — visited but not completed; `completed` — fully completed.
 */
export type JourneyLocationStatus = 'locked' | 'available' | 'in-progress' | 'visited' | 'completed';

/**
 * Content type of a scenario — determines the icon displayed on the journey map.
 *
 * @remarks
 * Maps to scenario categories: theory (reading/select cards), practice (memory/sound/draw),
 * test (code-select/timed), video, and case studies.
 */
export type JourneyContentType = 'theory' | 'practice' | 'test' | 'video' | 'case';

/**
 * Maps card kind values to journey content types.
 *
 * @remarks
 * Used to determine the icon and categorization of scenario nodes on the journey map.
 */
export const CARD_KIND_TO_CONTENT_TYPE: Record<string, JourneyContentType> = {
  select: 'theory',
  'code-select': 'test',
  symbol: 'theory',
  reading: 'theory',
  memory: 'practice',
  sound: 'practice',
  timed: 'test',
  keyboard: 'practice',
  draw: 'practice',
  tone: 'practice',
};

/**
 * A node representing a scenario location on the learning journey map.
 *
 * @remarks
 * Contains progress information, metadata, and user interaction state for each location.
 */
export type JourneyLocationNode = {
  /** Unique identifier for the location node. */
  id: string;
  /** Display title of the scenario/location. */
  title: string;
  /** Brief description of the scenario. */
  description: string;
  /** Number of cards in the scenario. */
  cardCount: number;
  /** Display order within the lesson/course. */
  order: number;
  /** Current status of the location. */
  status: JourneyLocationStatus;
  /** ID of the lesson (country) this location belongs to. */
  lessonId: string;
  /** Display title of the parent lesson. */
  lessonTitle: string;
  /** ID of the course (path) this location belongs to. */
  courseId: string;
  /** Display title of the parent course. */
  courseTitle: string;
  /** Scenario completion percentage (0–100). */
  completionPercent: number;
  /** Whether the location has been visited by the user. */
  visited: boolean;
  /** Whether the location is marked as favorite. */
  favorite: boolean;
  /** Reason why the location is locked (only when `status === 'locked'`). */
  blockReason: string | null;
  /** ID of the scenario this location represents. */
  scenarioId: string;
  /** Content types derived from the scenario's cards. */
  contentTypes: JourneyContentType[];
};

/**
 * Analytics event for a journey location.
 *
 * @remarks
 * Three event kinds are tracked: visit, duration, and completion.
 */
export type JourneyAnalyticsEvent =
  | {
      kind: 'visit';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      timestamp: string;
    }
  | {
      kind: 'duration';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      durationMs: number;
      timestamp: string;
    }
  | {
      kind: 'complete';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      completionPercent: number;
      timestamp: string;
    };

/**
 * Explorer level badge awarded based on journey activity.
 *
 * @remarks
 * Levels are computed from total visits and completions:
 * `novice` — new user; `experienced` — moderate activity; `expert` — high activity.
 */
export type ExplorerLevel = 'novice' | 'experienced' | 'expert';

/**
 * Result of explorer level computation.
 *
 * @remarks
 * Includes the current level, totals, and the next milestone thresholds.
 */
export type ExplorerLevelResult = {
  level: ExplorerLevel;
  totalVisits: number;
  totalCompleted: number;
  nextMilestone: {
    visitsNeeded: number;
    completedNeeded: number;
  };
};
