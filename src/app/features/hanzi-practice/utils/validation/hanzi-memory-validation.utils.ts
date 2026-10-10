import type { LearningProficiencyLevel } from '../../../../core/models/learning-proficiency.types';
import type { DrawCanvasPoint, DrawStrokePath } from '../../../../core/models/draw-practice.types';
import type { HanziCharacterModel } from '../../models/hanzi-character.model';
import { DEFAULT_HANZI_QUIZ_OPTIONS, type HanziQuizOptions } from '../../models/hanzi-character.types';
import { HanziPositioner } from '../positioning/hanzi-positioner';
import { HanziQuizSession, resolveHanziQuizLeniency } from '../quiz/hanzi-quiz-session';
import { matchHanziUserStroke } from './hanzi-stroke-match.utils';

/**
 * Grade assigned to a single user stroke after validation in memory mode.
 */
export type HanziMemoryStrokeGrade = 'correct' | 'incorrect';

/**
 * Result of batch validation of all user strokes in memory mode.
 */
export type HanziMemoryValidationResult = {
  /** Whether the user correctly reproduced all strokes. */
  passed: boolean;
  /** Expected number of strokes in the target character. */
  expectedStrokeCount: number;
  /** Number of strokes drawn by the user. */
  actualStrokeCount: number;
  /** Total number of stroke-level mistakes detected. */
  totalMistakes: number;
  /** Whether the validation session is complete (all strokes submitted). */
  completed: boolean;
};

/**
 * Optional configuration for memory validation.
 */
export type HanziMemoryValidationOptions = {
  /** Padding (in px) around the character. Defaults to `20`. */
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

/**
 * Returns the allowed stroke count tolerance for the given proficiency level.
 *
 * @param level - The learning proficiency level.
 * @returns The maximum allowed difference between expected and actual stroke count.
 */
export function resolveHanziMemoryStrokeCountTolerance(level: LearningProficiencyLevel): number {
  return STROKE_COUNT_TOLERANCE[level];
}

/**
 * Builds quiz options adjusted for the given proficiency level.
 *
 * @param proficiencyLevel - The learning proficiency level.
 * @returns Quiz options with leniency adjusted for the proficiency level.
 */
export function resolveHanziMemoryQuizOptions(
  proficiencyLevel: LearningProficiencyLevel,
): HanziQuizOptions {
  return {
    leniency: DEFAULT_HANZI_QUIZ_OPTIONS.leniency * resolveHanziQuizLeniency(proficiencyLevel),
    averageDistanceThreshold: DEFAULT_HANZI_QUIZ_OPTIONS.averageDistanceThreshold,
    acceptBackwardsStrokes: DEFAULT_HANZI_QUIZ_OPTIONS.acceptBackwardsStrokes,
  };
}

/**
 * Grades each user stroke for highlight feedback after "Check" in memory mode.
 *
 * @param model - The target HanziCharacterModel.
 * @param canvasSize - Canvas dimensions in pixels.
 * @param strokes - The user-drawn strokes in canvas coordinates.
 * @param proficiencyLevel - The learning proficiency level.
 * @param options - Optional validation configuration.
 * @returns An array of grades (`'correct'` or `'incorrect'`) for each stroke.
 */
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

    const characterPoints = stroke.map((point: DrawCanvasPoint) => positioner.toCharacterSpace(point));
    const match = matchHanziUserStroke(characterPoints, model, strokeIndex, quizOptions);
    return match.isMatch ? 'correct' : 'incorrect';
  });
}

/**
 * Batch-validates all user strokes in memory mode (order + shape).
 *
 * @param model - The target HanziCharacterModel.
 * @param canvasSize - Canvas dimensions in pixels.
 * @param strokes - The user-drawn strokes in canvas coordinates.
 * @param proficiencyLevel - The learning proficiency level.
 * @param options - Optional validation configuration.
 * @returns The validation result including pass/fail, stroke counts, and mistakes.
 */
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
