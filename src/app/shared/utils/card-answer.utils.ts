import { Card, isOptionCard } from '../../core/models';
import type { CardDirection } from '../../core/models/language-pair.types';
import {
  effectiveCardDirection,
  resolveKeyboardAcceptedAnswers,
  resolveOptionCard,
} from '../../core/data/card-direction.utils';
import { CardAnswerState } from '../types';

const normalizeAnswer = (value: string): string => value.trim().toLowerCase();

export const canCheckCardAnswer = (card: Card, state: CardAnswerState): boolean => {
  switch (card.kind) {
    case 'select':
    case 'symbol':
    case 'sound':
    case 'timed':
      return state.selectedIndex !== null;
    case 'keyboard':
      return state.answerText.trim().length > 0;
    case 'memory':
      return state.memoryComplete;
    case 'draw':
      return state.drawSubmitted;
  }
};

export const checkCardAnswer = (
  card: Card,
  state: CardAnswerState,
  sessionDirection: CardDirection = 'known-to-learning',
): boolean | null => {
  if (!canCheckCardAnswer(card, state)) {
    return null;
  }

  if (isOptionCard(card)) {
    const direction = effectiveCardDirection(card.direction, sessionDirection);
    const resolved = resolveOptionCard(card, direction);
    return state.selectedIndex === resolved.correctIndex;
  }

  switch (card.kind) {
    case 'keyboard': {
      const direction = effectiveCardDirection(card.direction, sessionDirection);
      const accepted = resolveKeyboardAcceptedAnswers(card, direction);
      return accepted.some(
        (answer) => normalizeAnswer(answer) === normalizeAnswer(state.answerText),
      );
    }
    case 'memory':
      return state.memoryComplete;
    case 'draw':
      return state.drawSubmitted;
  }
};

export const getCorrectAnswerLabel = (
  card: Card,
  sessionDirection: CardDirection = 'known-to-learning',
): string | null => {
  if (isOptionCard(card)) {
    const direction = effectiveCardDirection(card.direction, sessionDirection);
    const resolved = resolveOptionCard(card, direction);
    return resolved.options[resolved.correctIndex] ?? null;
  }

  if (card.kind === 'keyboard') {
    const direction = effectiveCardDirection(card.direction, sessionDirection);
    const accepted = resolveKeyboardAcceptedAnswers(card, direction);
    return accepted[0] ?? null;
  }

  return null;
};
