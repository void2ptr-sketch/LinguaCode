import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import type { DrawStrokePath } from '../../shared/components/draw-canvas/draw-canvas.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import { DEFAULT_HANZI_QUIZ_OPTIONS, type HanziQuizOptions } from './hanzi-character.types';
import { HanziPositioner } from './hanzi-positioner';
import { HanziQuizSession, resolveHanziQuizLeniency } from './hanzi-quiz-session';
import { matchHanziUserStroke } from './hanzi-stroke-match.utils';

export type HanziMemoryStrokeGrade = 'correct' | 'incorrect';

export type HanziMemoryValidationResult = {
  passed: boolean;
  expectedStrokeCount: number;
  actualStrokeCount: number;
  totalMistakes: number;
  completed: boolean;
};

export type HanziMemoryValidationOptions = {
  padding?: number;
};

const STROKE_COUNT_TOLERANCE: Record<LearningProficiencyLevel, number> = {
  'new-to-language': 2,
  beginner: 1,
  elementary: 1,
  intermediate: 0,
  'upper-intermediate': 0,
  advanced: 0,
  professional: 0,
};

export function resolveHanziMemoryStrokeCountTolerance(
  level: LearningProficiencyLevel,
): number {
  return STROKE_COUNT_TOLERANCE[level];
}

export function resolveHanziMemoryQuizOptions(
  proficiencyLevel: LearningProficiencyLevel,
): HanziQuizOptions {
  return {
    leniency: DEFAULT_HANZI_QUIZ_OPTIONS.leniency * resolveHanziQuizLeniency(proficiencyLevel),
    averageDistanceThreshold: DEFAULT_HANZI_QUIZ_OPTIONS.averageDistanceThreshold,
    acceptBackwardsStrokes: DEFAULT_HANZI_QUIZ_OPTIONS.acceptBackwardsStrokes,
  };
}

/** Оценка каждого штриха пользователя для подсветки после «Проверить». */
export function gradeHanziMemoryStrokes(
  model: HanziCharacterModel,
  canvasSize: { width: number; height: number },
  strokes: readonly DrawStrokePath[],
  proficiencyLevel: LearningProficiencyLevel,
  options: HanziMemoryValidationOptions = {},
): readonly HanziMemoryStrokeGrade[] {
  const positioner = new HanziPositioner({
    width: canvasSize.width,
    height: canvasSize.height,
    padding: options.padding ?? 20,
  });
  const quizOptions = resolveHanziMemoryQuizOptions(proficiencyLevel);

  return strokes.map((stroke, strokeIndex) => {
    if (!stroke.length) {
      return 'incorrect';
    }

    const characterPoints = stroke.map((point) => positioner.toCharacterSpace(point));
    const match = matchHanziUserStroke(characterPoints, model, strokeIndex, quizOptions);
    return match.isMatch ? 'correct' : 'incorrect';
  });
}

/** Batch-валидация всех черт пользователя в memory mode (порядок + форма). */
export function validateHanziMemoryStrokes(
  model: HanziCharacterModel,
  canvasSize: { width: number; height: number },
  strokes: readonly DrawStrokePath[],
  proficiencyLevel: LearningProficiencyLevel,
  options: HanziMemoryValidationOptions = {},
): HanziMemoryValidationResult {
  const expectedStrokeCount = model.strokes.length;
  const actualStrokeCount = strokes.length;
  const tolerance = resolveHanziMemoryStrokeCountTolerance(proficiencyLevel);

  if (Math.abs(actualStrokeCount - expectedStrokeCount) > tolerance) {
    return {
      passed: false,
      expectedStrokeCount,
      actualStrokeCount,
      totalMistakes: 0,
      completed: false,
    };
  }

  const positioner = new HanziPositioner({
    width: canvasSize.width,
    height: canvasSize.height,
    padding: options.padding ?? 20,
  });
  const session = new HanziQuizSession(model, positioner, {
    proficiencyLevel,
    markStrokeCorrectAfterMisses: false,
  });

  const strokesToValidate = Math.min(strokes.length, expectedStrokeCount);
  for (let index = 0; index < strokesToValidate; index += 1) {
    const stroke = strokes[index];
    if (!stroke?.length) {
      return {
        passed: false,
        expectedStrokeCount,
        actualStrokeCount,
        totalMistakes: session.totalMistakes(),
        completed: false,
      };
    }

    const result = session.submitCanvasStroke(stroke);
    if (!result.accepted) {
      return {
        passed: false,
        expectedStrokeCount,
        actualStrokeCount,
        totalMistakes: session.totalMistakes(),
        completed: false,
      };
    }
  }

  const completed = session.completed();
  return {
    passed: completed,
    expectedStrokeCount,
    actualStrokeCount,
    totalMistakes: session.totalMistakes(),
    completed,
  };
}
