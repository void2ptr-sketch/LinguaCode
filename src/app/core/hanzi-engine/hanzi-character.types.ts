/** A 2D point coordinate. */
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

/** Loading state for Hanzi character data. */
export type HanziLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

/** Options for the Hanzi canvas positioner. */
export type HanziPositionerOptions = {
  width: number;
  height: number;
  padding?: number;
};

/** Canvas transform state for Hanzi drawing. */
export type HanziCanvasTransform = {
  offsetX: number;
  offsetY: number;
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

/** User-drawn stroke input for Hanzi quiz evaluation. */
export type HanziUserStrokeInput = {
  points: readonly HanziPoint[];
};

export const HANZI_ASSETS_BASE_PATH = '/assets/hanzi';
export const HANZI_RADICAL_ASSETS_BASE_PATH = '/assets/hanzi/radical';

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

/** MMH bounding box (Hanzi Writer Positioner). */
export const HANZI_CHARACTER_BOUNDS = {
  minX: 0,
  maxX: 1024,
  minY: -124,
  maxY: 900,
} as const;
