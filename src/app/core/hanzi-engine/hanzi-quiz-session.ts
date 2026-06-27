import { computed, signal } from '@angular/core';

import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import {
  DEFAULT_HANZI_QUIZ_OPTIONS,
  type HanziPoint,
  type HanziQuizOptions,
  type HanziQuizStrokeResult,
} from './hanzi-character.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import type { HanziPositioner } from './hanzi-positioner';
import { matchHanziUserStroke } from './hanzi-stroke-match.utils';

const LENIENCY_BY_LEVEL: Record<LearningProficiencyLevel, number> = {
  'new-to-language': 1.35,
  beginner: 1.2,
  elementary: 1.1,
  intermediate: 1,
  'upper-intermediate': 0.9,
  advanced: 0.8,
  professional: 0.7,
};

export type HanziQuizSessionOptions = HanziQuizOptions & {
  proficiencyLevel?: LearningProficiencyLevel;
};

export type HanziQuizSummary = {
  character: string;
  totalMistakes: number;
  strokeCount: number;
};

/** Сессия quiz для одного иероглифа (порядок черт, hints, leniency). */
export class HanziQuizSession {
  private readonly options: {
    leniency: number;
    averageDistanceThreshold: number;
    showHintAfterMisses: number | false;
    acceptBackwardsStrokes: boolean;
    markStrokeCorrectAfterMisses: number | false;
    isOutlineVisible: boolean;
  };

  readonly strokeIndex = signal(0);
  readonly mistakesOnStroke = signal(0);
  readonly totalMistakes = signal(0);
  readonly completed = signal(false);
  readonly lastResult = signal<HanziQuizStrokeResult | null>(null);

  readonly strokesRemaining = computed(() =>
    Math.max(this.character.strokes.length - this.strokeIndex(), 0),
  );

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

  reset(): void {
    this.strokeIndex.set(0);
    this.mistakesOnStroke.set(0);
    this.totalMistakes.set(0);
    this.completed.set(false);
    this.lastResult.set(null);
  }

  submitCanvasStroke(canvasPoints: readonly HanziPoint[]): HanziQuizStrokeResult {
    const characterPoints = canvasPoints.map((point) => this.positioner.toCharacterSpace(point));
    return this.submitCharacterStroke(characterPoints);
  }

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

export function resolveHanziQuizLeniency(level: LearningProficiencyLevel): number {
  return LENIENCY_BY_LEVEL[level];
}
