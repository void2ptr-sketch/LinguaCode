import type { DrawCard } from '../../../../core/models';
import type { LearningProficiencyLevel } from '../../../../core/models';
import type { DrawAnswerPayload } from '../../../../shared/types/draw-answer.types';
import { validateHanziMemoryStrokes } from './hanzi-memory-validation.utils';
import type { HanziCharacterModel } from '../../models/hanzi-character.model';
import {
  isHanCharacter,
  resolveDrawCharacterTargets,
} from '../../../../core/domain/chinese/drawing/draw-card.utils';

/** Резолвер для получения модели иероглифа по строке. */
export type HanziModelResolver = (character: string) => HanziCharacterModel | null;

/** Проверяет ответ пользователя на карточке практики письма: наличие штрихов, валидацию по памяти. */
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
