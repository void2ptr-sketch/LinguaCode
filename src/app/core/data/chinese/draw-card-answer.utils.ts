import type { DrawCard } from '../../models';
import type { LearningProficiencyLevel } from '../../models/learning-proficiency.types';
import type { DrawAnswerPayload } from '../../../shared/types/draw-answer.types';
import type { HanziCharacterModel } from '../../hanzi-engine/hanzi-character.model';
import { validateHanziMemoryStrokes } from '../../hanzi-engine/hanzi-memory-validation.utils';
import { isHanCharacter, resolveDrawCharacterTargets } from './draw-card.utils';

export type HanziModelResolver = (character: string) => HanziCharacterModel | null;

export function checkDrawCardAnswer(
  card: DrawCard,
  drawSubmitted: boolean,
  drawAnswer: DrawAnswerPayload | null | undefined,
  proficiencyLevel: LearningProficiencyLevel,
  getHanziModel?: HanziModelResolver,
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

  const targets = resolveDrawCharacterTargets(card);

  for (let index = 0; index < targets.length; index += 1) {
    const character = targets[index]?.character?.trim() ?? '';
    if (!character || !isHanCharacter(character)) {
      continue;
    }

    const model = getHanziModel?.(character) ?? null;
    if (!model) {
      return false;
    }

    const strokes = drawAnswer.strokesByCharacter[index] ?? [];
    const result = validateHanziMemoryStrokes(
      model,
      drawAnswer.canvasSize,
      strokes,
      proficiencyLevel,
    );

    if (!result.passed) {
      return false;
    }
  }

  return true;
}
