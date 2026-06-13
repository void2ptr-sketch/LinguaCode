import { Card, CardAppearance, CardKind } from '../../../core/models';
import { CardDraft } from '../types';

export const emptyCardDraft = (kind: CardKind, appearance: CardAppearance): CardDraft => {
  switch (kind) {
    case 'select':
      return {
        kind: 'select',
        title: '',
        question: '',
        options: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'memory':
      return {
        kind: 'memory',
        title: '',
        prompt: '',
        pairs: [{ front: '', back: '' }],
        appearance: { ...appearance },
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: '',
        prompt: '',
        symbols: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'sound':
      return {
        kind: 'sound',
        title: '',
        prompt: '',
        audioLabel: '',
        options: ['', ''],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'timed':
      return {
        kind: 'timed',
        title: '',
        question: '',
        options: ['', ''],
        correctIndex: 0,
        timeLimitSec: 30,
        appearance: { ...appearance },
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: '',
        prompt: '',
        acceptedAnswers: [''],
        appearance: { ...appearance },
      };
    case 'draw':
      return {
        kind: 'draw',
        title: '',
        prompt: '',
        referenceHint: '',
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
        question: card.question,
        options: [...card.options],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'memory':
      return {
        kind: 'memory',
        title: card.title,
        prompt: card.prompt,
        pairs: card.pairs.map((pair) => ({ ...pair })),
        appearance,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: card.title,
        prompt: card.prompt,
        symbols: [...card.symbols],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: card.title,
        prompt: card.prompt,
        audioLabel: card.audioLabel,
        options: [...card.options],
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: card.title,
        question: card.question,
        options: [...card.options],
        correctIndex: card.correctIndex,
        timeLimitSec: card.timeLimitSec,
        appearance,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: card.title,
        prompt: card.prompt,
        acceptedAnswers: [...card.acceptedAnswers],
        appearance,
      };
    case 'draw':
      return {
        kind: 'draw',
        title: card.title,
        prompt: card.prompt,
        referenceHint: card.referenceHint,
        appearance,
      };
  }
};

export const cardSummary = (card: Card): string => {
  switch (card.kind) {
    case 'select':
      return card.question;
    case 'memory':
      return card.prompt;
    case 'symbol':
    case 'sound':
    case 'keyboard':
    case 'draw':
      return card.prompt;
    case 'timed':
      return card.question;
  }
};
