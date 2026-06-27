export {
  HANZI_ASSETS_BASE_PATH,
  HANZI_CHARACTER_BOUNDS,
  DEFAULT_HANZI_QUIZ_OPTIONS,
  type HanziCanvasTransform,
  type HanziCharacterJson,
  type HanziLoadState,
  type HanziPoint,
  type HanziPositionerOptions,
  type HanziQuizOptions,
  type HanziQuizStrokeResult,
  type HanziUserStrokeInput,
} from './hanzi-character.types';

export {
  HanziPositioner,
  mapPointsToCanvas,
  parseHanziMedianPoints,
} from './hanzi-positioner';

export {
  buildHanziCharacterModel,
  type HanziCharacterModel,
  type HanziStrokeModel,
  hanziStrokeAverageDistance,
} from './hanzi-character.model';

export { HanziDataService } from './hanzi-data.service';

export {
  HanziQuizSession,
  resolveHanziQuizLeniency,
  type HanziQuizSessionOptions,
  type HanziQuizSummary,
} from './hanzi-quiz-session';

export { matchHanziUserStroke, type HanziStrokeMatchResult } from './hanzi-stroke-match.utils';

export {
  DEFAULT_HANZI_TRACING_OPTIONS,
  prepareHanziTracingSamples,
  resolveHanziTracingFrame,
  sliceHanziPolylineByProgress,
  tracingRevealProgress,
  type HanziTracingAnimationOptions,
  type HanziTracingFrame,
  type HanziTracingStrokeSample,
  type HanziTracingTip,
} from './hanzi-tracing-animation.utils';

export {
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from './hanzi-render.utils';

export {
  resolveHanziMemoryStrokeCountTolerance,
  validateHanziMemoryStrokes,
  type HanziMemoryValidationOptions,
  type HanziMemoryValidationResult,
} from './hanzi-memory-validation.utils';

export {
  GOLDEN_CANVAS_PADDING,
  GOLDEN_CANVAS_SIZE,
  GOLDEN_HANZI_CHARACTERS,
  buildGoldenHanziModel,
  cornerScribbleStroke,
  fetchGoldenHanziJson,
  goldenAlignedStrokes,
  offsetDrawStrokes,
  type GoldenHanziCharacter,
} from './hanzi-golden-test.utils';
