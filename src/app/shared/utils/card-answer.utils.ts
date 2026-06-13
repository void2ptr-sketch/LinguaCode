import { Card, isOptionCard } from '../../core/models';
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

export const checkCardAnswer = (card: Card, state: CardAnswerState): boolean | null => {
  if (!canCheckCardAnswer(card, state)) {
    return null;
  }

  if (isOptionCard(card)) {
    return state.selectedIndex === card.correctIndex;
  }

  switch (card.kind) {
    case 'keyboard':
      return card.acceptedAnswers.some(
        (answer) => normalizeAnswer(answer) === normalizeAnswer(state.answerText),
      );
    case 'memory':
      return state.memoryComplete;
    case 'draw':
      return state.drawSubmitted;
  }
};

export const getCorrectAnswerLabel = (card: Card): string | null => {
  if (isOptionCard(card)) {
    const options =
      card.kind === 'select' || card.kind === 'timed' || card.kind === 'sound'
        ? card.options
        : card.kind === 'symbol'
          ? card.symbols
          : [];

    return options[card.correctIndex] ?? null;
  }

  if (card.kind === 'keyboard') {
    return card.acceptedAnswers[0] ?? null;
  }

  return null;
};
