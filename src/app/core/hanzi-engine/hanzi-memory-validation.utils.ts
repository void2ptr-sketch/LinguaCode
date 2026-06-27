import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import type { DrawStrokePath } from '../../shared/components/draw-canvas/draw-canvas.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import { HanziPositioner } from './hanzi-positioner';
import { HanziQuizSession } from './hanzi-quiz-session';

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
