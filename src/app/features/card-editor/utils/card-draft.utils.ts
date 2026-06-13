import { Card, CardAppearance, CardKind } from '../../../core/models';
import { CardDraft, DEFAULT_CARD_DIRECTION } from '../types';

export const emptyCardDraft = (kind: CardKind, appearance: CardAppearance): CardDraft => {
  switch (kind) {
    case 'select':
      return {
        kind: 'select',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'memory':
      return {
        kind: 'memory',
        title: '',
        promptKnown: '',
        pairs: [{ known: '', learning: '' }],
        appearance: { ...appearance },
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        symbols: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'sound':
      return {
        kind: 'sound',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        audioLabelLearning: '',
        optionsKnown: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'timed':
      return {
        kind: 'timed',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        correctIndex: 0,
        timeLimitSec: 30,
        appearance: { ...appearance },
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        acceptedAnswersKnown: [''],
        appearance: { ...appearance },
      };
    case 'draw':
      return {
        kind: 'draw',
        title: '',
        promptKnown: '',
        referenceHintKnown: '',
        appearance: { ...appearance },
      };
  }
};

export const cardToDraft = (card: Card): CardDraft => {
  const appearance = { ...card.appearance };

  switch (card.kind) {
    case 'select':
      return {
        kind: 'select',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'memory':
      return {
        kind: 'memory',
        title: card.title,
        promptKnown: card.promptKnown,
        pairs: card.pairs.map((pair) => ({ ...pair })),
        appearance,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        symbols: [...card.symbols],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        audioLabelLearning: card.audioLabelLearning,
        optionsKnown: [...card.optionsKnown],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        correctIndex: card.correctIndex,
        timeLimitSec: card.timeLimitSec,
        appearance,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        acceptedAnswersKnown: [...card.acceptedAnswersKnown],
        appearance,
      };
    case 'draw':
      return {
        kind: 'draw',
        title: card.title,
        promptKnown: card.promptKnown,
        referenceHintKnown: card.referenceHintKnown,
        appearance,
      };
  }
};

export const cardSummary = (card: Card): string => {
  return card.promptKnown;
};
