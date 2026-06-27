import type { DrawCard } from '../models';
import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import type { DrawAnswerPayload } from '../../shared/types/draw-answer.types';
import { resolveDrawCharacterTargets } from './draw-card.utils';
import {
  resolveDrawStrokeValidationThresholds,
  validateDrawStrokesAgainstGuides,
} from './draw-stroke-validation.utils';

export function checkDrawCardAnswer(
  card: DrawCard,
  drawSubmitted: boolean,
  drawAnswer: DrawAnswerPayload | null | undefined,
  proficiencyLevel: LearningProficiencyLevel,
): boolean {
  if (!drawSubmitted || !drawAnswer) {
    return false;
  }

  const hasAnyStroke = drawAnswer.strokesByCharacter.some((strokes) => strokes.length > 0);
  if (!hasAnyStroke) {
    return false;
  }

  if (drawAnswer.canvasMode !== 'memory') {
    return true;
  }

  const thresholds = resolveDrawStrokeValidationThresholds(proficiencyLevel);
  const targets = resolveDrawCharacterTargets(card);

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const guides = target.strokeGuides?.length
      ? target.strokeGuides
      : index === 0
        ? card.strokeGuides
        : undefined;

    if (!guides?.length) {
      continue;
    }

    const strokes = drawAnswer.strokesByCharacter[index] ?? [];
    const result = validateDrawStrokesAgainstGuides({
      strokes,
      guides,
      canvasSize: drawAnswer.canvasSize,
      thresholds,
    });

    if (!result.passed) {
      return false;
    }
  }

  return true;
}
