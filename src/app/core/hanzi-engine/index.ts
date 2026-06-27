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
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from './hanzi-render.utils';
