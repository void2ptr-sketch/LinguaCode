export type HanziPoint = {
  x: number;
  y: number;
};

/** JSON из Make Me a Hanzi / hanzi-writer-data. */
export type HanziCharacterJson = {
  strokes: readonly string[];
  medians: readonly (readonly (HanziPoint | readonly [number, number])[])[];
  radStrokes?: readonly number[];
};

export type HanziLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

export type HanziPositionerOptions = {
  width: number;
  height: number;
  padding?: number;
};

export type HanziCanvasTransform = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type HanziQuizOptions = {
  /** 1 = default HW leniency; меньше — строже. */
  leniency?: number;
  averageDistanceThreshold?: number;
  showHintAfterMisses?: number | false;
  acceptBackwardsStrokes?: boolean;
  markStrokeCorrectAfterMisses?: number | false;
  isOutlineVisible?: boolean;
};

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
