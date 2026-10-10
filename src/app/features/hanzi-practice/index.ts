export {
  HANZI_ASSETS_BASE_PATH,
  HANZI_RADICAL_ASSETS_BASE_PATH,
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
} from './models/hanzi-character.types';

export {
  HanziPositioner,
  mapPointsToCanvas,
  parseHanziMedianPoints,
} from './utils/hanzi-positioner';

export {
  buildHanziCharacterModel,
  type HanziCharacterModel,
  type HanziStrokeModel,
  hanziStrokeAverageDistance,
} from './models/hanzi-character.model';

export { HanziDataService } from './services/hanzi-data.service';

export {
  HanziQuizSession,
  resolveHanziQuizLeniency,
  type HanziQuizSessionOptions,
  type HanziQuizSummary,
} from './utils/hanzi-quiz-session';

export { matchHanziUserStroke, type HanziStrokeMatchResult } from './utils/hanzi-stroke-match.utils';

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
} from './utils/hanzi-tracing-animation.utils';

export {
  applyHanziCanvasPathTransform,
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from './utils/hanzi-render.utils';

export {
  resolveHanziHintStrokeFrame,
  type HanziHintStrokeFrame,
} from './utils/hanzi-hint-animation.utils';

export {
  resolveRadicalComponentCellCenter,
  resolveRadicalComponentSvgTransform,
} from './utils/hanzi-radical-layout.utils';

export {
  gradeHanziMemoryStrokes,
  resolveHanziMemoryStrokeCountTolerance,
  validateHanziMemoryStrokes,
  type HanziMemoryValidationOptions,
  type HanziMemoryValidationResult,
} from './utils/hanzi-memory-validation.utils';

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
} from './utils/hanzi-golden-test.utils';

export { DrawCanvasComponent } from './components/draw-canvas/draw-canvas.component';
export type { DrawRadicalHint } from './components/draw-canvas/draw-canvas.component';

export { DrawCardComponent } from './components/draw-card/draw-card.component';

export {
  checkDrawCardAnswer,
  type HanziModelResolver,
} from './utils/hanzi-card-answer.util';
