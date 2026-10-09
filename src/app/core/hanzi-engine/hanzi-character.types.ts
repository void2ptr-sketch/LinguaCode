/**
 * A 2D point coordinate used in Hanzi stroke data.
 *
 * @remarks
 * Coordinates are in the Hanzi Writer viewBox space (0–1024).
 */
export type HanziPoint = {
  x: number;
  y: number;
};

/**
 * Character JSON format from Make Me a Hanzi / hanzi-writer-data.
 *
 * @remarks
 * Contains stroke paths, median points for each stroke, and optional radical stroke indices.
 */
export type HanziCharacterJson = {
  strokes: readonly string[];
  medians: readonly (readonly (HanziPoint | readonly [number, number])[])[];
  radStrokes?: readonly number[];
};

/**
 * Loading state for Hanzi character data.
 *
 * @remarks
 * `idle` — not yet loaded; `loading` — fetching from assets; `ready` — data available;
 * `missing` — character data not found; `error` — loading failed.
 */
export type HanziLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

/**
 * Options for the Hanzi canvas positioner.
 *
 * @remarks
 * Controls the viewBox dimensions and padding around the character.
 */
export type HanziPositionerOptions = {
  /** ViewBox width in pixels. */
  width: number;
  /** ViewBox height in pixels. */
  height: number;
  /** Optional padding around the character (default: 0). */
  padding?: number;
};

/**
 * Canvas transform state for Hanzi drawing.
 *
 * @remarks
 * Applied to offset and scale the drawing canvas for zoom/pan operations.
 */
export type HanziCanvasTransform = {
  /** Horizontal offset in pixels. */
  offsetX: number;
  /** Vertical offset in pixels. */
  offsetY: number;
  /** Zoom scale factor. */
  scale: number;
};

/**
 * Configuration options for Hanzi quiz (character drawing evaluation).
 *
 * @remarks
 * Controls leniency, hint display, and stroke acceptance behavior.
 */
export type HanziQuizOptions = {
  /** 1 = default Hanzi Writer leniency; lower values are stricter. */
  leniency?: number;
  averageDistanceThreshold?: number;
  showHintAfterMisses?: number | false;
  acceptBackwardsStrokes?: boolean;
  markStrokeCorrectAfterMisses?: number | false;
  isOutlineVisible?: boolean;
};

/**
 * Result of evaluating a single stroke during a Hanzi quiz.
 *
 * @remarks
 * Includes acceptance status, mistake count, and hint/forced-correct flags.
 */
export type HanziQuizStrokeResult = {
  accepted: boolean;
  completed: boolean;
  strokeIndex: number;
  mistakesOnStroke: number;
  totalMistakes: number;
  strokesRemaining: number;
  isBackwards: boolean;
  showHint: boolean;
  forcedCorrect: boolean;
};

/**
 * User-drawn stroke input for Hanzi quiz evaluation.
 *
 * @remarks
 * Contains the sequence of points the user drew, used for stroke comparison
 * and answer validation in draw cards and Hanzi quizzes.
 */
export type HanziUserStrokeInput = {
  /** Sequence of points forming the drawn stroke. */
  points: readonly HanziPoint[];
};

/** Base path for Hanzi character stroke data assets. */
export const HANZI_ASSETS_BASE_PATH = '/assets/hanzi';

/** Base path for Hanzi radical stroke data assets. */
export const HANZI_RADICAL_ASSETS_BASE_PATH = '/assets/hanzi/radical';

/**
 * Default Hanzi quiz options with all fields required.
 *
 * @remarks
 * `leniency: 1` — default Hanzi Writer tolerance; `showHintAfterMisses: 3` — show hint after 3 mistakes;
 * `acceptBackwardsStrokes: false` — reject strokes drawn in wrong direction.
 */
export const DEFAULT_HANZI_QUIZ_OPTIONS: Required<
  Pick<
    HanziQuizOptions,
    | 'leniency'
    | 'averageDistanceThreshold'
    | 'showHintAfterMisses'
    | 'acceptBackwardsStrokes'
    | 'markStrokeCorrectAfterMisses'
    | 'isOutlineVisible'
  >
> = {
  leniency: 1,
  averageDistanceThreshold: 350,
  showHintAfterMisses: 3,
  acceptBackwardsStrokes: false,
  markStrokeCorrectAfterMisses: false,
  isOutlineVisible: false,
};

/**
 * Make Me a Hanzi / Hanzi Writer character bounding box.
 *
 * @remarks
 * Defines the viewBox range for character rendering (0–1024 in X, -124 to 900 in Y).
 */
export const HANZI_CHARACTER_BOUNDS = {
  minX: 0,
  maxX: 1024,
  minY: -124,
  maxY: 900,
} as const;
