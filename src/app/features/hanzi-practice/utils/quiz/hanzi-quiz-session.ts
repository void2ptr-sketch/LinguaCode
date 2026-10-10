import { computed, signal } from '@angular/core';

import type { LearningProficiencyLevel } from '../../../../core/models/learning-proficiency.types';
import {
  DEFAULT_HANZI_QUIZ_OPTIONS,
  type HanziPoint,
  type HanziQuizOptions,
  type HanziQuizStrokeResult,
} from '../../models/hanzi-character.types';
import type { HanziCharacterModel } from '../../models/hanzi-character.model';
import type { HanziPositioner } from '../positioning/hanzi-positioner';
import { matchHanziUserStroke } from '../validation/hanzi-stroke-match.utils';

const LENIENCY_BY_LEVEL: Record<LearningProficiencyLevel, number> = {
  'new-to-language': 1.35,
  beginner: 1.2,
  elementary: 1.1,
  intermediate: 1,
  'upper-intermediate': 0.9,
  advanced: 0.8,
  professional: 0.7,
};

/**
 * Configuration options for a quiz session, extending base quiz options with proficiency level.
 */
export type HanziQuizSessionOptions = HanziQuizOptions & {
  /** Proficiency level used to adjust leniency. When omitted, leniency is not adjusted. */
  proficiencyLevel?: LearningProficiencyLevel;
};

/**
 * Summary of a completed quiz session.
 */
export type HanziQuizSummary = {
  /** The character that was quizzed. */
  character: string;
  /** Total number of mistakes across all strokes. */
  totalMistakes: number;
  /** Total number of strokes in the character. */
  strokeCount: number;
};

/**
 * Session for quizzing a single Hanzi character (stroke order, hints, leniency).
 */
export class HanziQuizSession {
  private readonly options: {
    leniency: number;
    averageDistanceThreshold: number;
    showHintAfterMisses: number | false;
    acceptBackwardsStrokes: boolean;
    markStrokeCorrectAfterMisses: number | false;
    isOutlineVisible: boolean;
  };

  /** Index of the next stroke the user must draw. */
  readonly strokeIndex = signal(0);
  /** Number of mistakes made on the current stroke. */
  readonly mistakesOnStroke = signal(0);
  /** Cumulative mistake count across all strokes. */
  readonly totalMistakes = signal(0);
  /** Whether the quiz session is fully completed. */
  readonly completed = signal(false);
  /** Result of the most recently submitted stroke. */
  readonly lastResult = signal<HanziQuizStrokeResult | null>(null);

  /**
   * Number of strokes remaining until completion.
   */
  readonly strokesRemaining = computed(() =>
    Math.max(this.character.strokes.length - this.strokeIndex(), 0),
  );

  /**
   * Whether a hint should be displayed based on the current mistake count.
   */
  readonly shouldShowHint = computed(() => {
    const threshold = this.options.showHintAfterMisses;
    if (threshold === false) {
      return false;
    }

    return this.mistakesOnStroke() >= threshold && !this.completed();
  });

  constructor(
    readonly character: HanziCharacterModel,
    private readonly positioner: HanziPositioner,
    options: HanziQuizSessionOptions = {},
  ) {
    const levelLeniency = options.proficiencyLevel
      ? LENIENCY_BY_LEVEL[options.proficiencyLevel]
      : 1;

    this.options = {
      leniency: (options.leniency ?? DEFAULT_HANZI_QUIZ_OPTIONS.leniency) * levelLeniency,
      averageDistanceThreshold:
        options.averageDistanceThreshold ?? DEFAULT_HANZI_QUIZ_OPTIONS.averageDistanceThreshold,
      showHintAfterMisses:
        options.showHintAfterMisses ?? DEFAULT_HANZI_QUIZ_OPTIONS.showHintAfterMisses,
      acceptBackwardsStrokes:
        options.acceptBackwardsStrokes ?? DEFAULT_HANZI_QUIZ_OPTIONS.acceptBackwardsStrokes,
      markStrokeCorrectAfterMisses:
        options.markStrokeCorrectAfterMisses ??
        DEFAULT_HANZI_QUIZ_OPTIONS.markStrokeCorrectAfterMisses,
      isOutlineVisible: options.isOutlineVisible ?? DEFAULT_HANZI_QUIZ_OPTIONS.isOutlineVisible,
    };
  }

  /** Resets all signals to their initial values, allowing the session to be reused. */
  reset(): void {
    this.strokeIndex.set(0);
    this.mistakesOnStroke.set(0);
    this.totalMistakes.set(0);
    this.completed.set(false);
    this.lastResult.set(null);
  }

  /**
   * Submits a stroke drawn on the canvas (in pixel coordinates).
   *
   * @param canvasPoints - The user-drawn points in canvas pixel coordinates.
   * @returns The stroke evaluation result.
   * @remarks Converts to character space internally using the positioner.
   */
  submitCanvasStroke(canvasPoints: readonly HanziPoint[]): HanziQuizStrokeResult {
    const characterPoints = canvasPoints.map((point) => this.positioner.toCharacterSpace(point));
    return this.submitCharacterStroke(characterPoints);
  }

  /**
   * Submits a stroke already in character (MMH) coordinates for evaluation.
   *
   * @param characterPoints - The user-drawn points in MMH character coordinates.
   * @returns The stroke evaluation result.
   */
  submitCharacterStroke(characterPoints: readonly HanziPoint[]): HanziQuizStrokeResult {
    if (this.completed()) {
      return this.buildResult({
        accepted: false,
        isBackwards: false,
        forcedCorrect: false,
      });
    }

    const strokeIndex = this.strokeIndex();
    const match = matchHanziUserStroke(characterPoints, this.character, strokeIndex, this.options);

    let accepted = match.isMatch;
    let forcedCorrect = false;

    const markAfter = this.options.markStrokeCorrectAfterMisses;
    if (
      !accepted &&
      typeof markAfter === 'number' &&
      Number.isFinite(markAfter) &&
      this.mistakesOnStroke() + 1 >= markAfter
    ) {
      accepted = true;
      forcedCorrect = true;
    }

    if (!accepted) {
      this.mistakesOnStroke.update((value) => value + 1);
      this.totalMistakes.update((value) => value + 1);
      const result = this.buildResult({
        accepted: false,
        isBackwards: match.meta.isStrokeBackwards,
        forcedCorrect: false,
      });
      this.lastResult.set(result);
      return result;
    }

    this.strokeIndex.update((value) => value + 1);
    this.mistakesOnStroke.set(0);

    const completed = this.strokeIndex() >= this.character.strokes.length;
    this.completed.set(completed);

    const result = this.buildResult({
      accepted: true,
      isBackwards: match.meta.isStrokeBackwards,
      forcedCorrect,
    });
    this.lastResult.set(result);
    return result;
  }

  /**
   * Returns a summary of the session state (mistakes and stroke count).
   *
   * @returns A HanziQuizSummary with character, total mistakes, and stroke count.
   */
  summary(): HanziQuizSummary {
    return {
      character: this.character.character,
      totalMistakes: this.totalMistakes(),
      strokeCount: this.character.strokes.length,
    };
  }

  private buildResult(input: {
    accepted: boolean;
    isBackwards: boolean;
    forcedCorrect: boolean;
  }): HanziQuizStrokeResult {
    return {
      accepted: input.accepted,
      completed: this.completed(),
      strokeIndex: this.strokeIndex(),
      mistakesOnStroke: this.mistakesOnStroke(),
      totalMistakes: this.totalMistakes(),
      strokesRemaining: this.strokesRemaining(),
      isBackwards: input.isBackwards,
      showHint: this.shouldShowHint(),
      forcedCorrect: input.forcedCorrect,
    };
  }
}

/**
 * Returns the leniency multiplier for the given proficiency level.
 *
 * @param level - The learning proficiency level.
 * @returns The leniency multiplier (higher = more forgiving).
 */
export function resolveHanziQuizLeniency(level: LearningProficiencyLevel): number {
  return LENIENCY_BY_LEVEL[level];
}
