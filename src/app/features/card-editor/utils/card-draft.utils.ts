import { Card, CardAppearance, CardKind } from '../../../core/models';
import { lexemeToDraftFields } from '../../../core/data/lexeme-draft.utils';
import {
  CardDraft,
  DEFAULT_CARD_DIRECTION,
  emptyLexemeCardDraft,
  emptyMemoryPairDraft,
  emptyOptionLexemes,
} from '../types';

export const emptyCardDraft = (kind: CardKind, appearance: CardAppearance): CardDraft => {
  const lexemeFields = emptyLexemeCardDraft();

  switch (kind) {
    case 'select':
      return {
        kind: 'select',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'memory':
      return {
        kind: 'memory',
        title: '',
        promptKnown: '',
        pairs: [emptyMemoryPairDraft()],
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        symbols: ['', ''],
        symbolLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        audioLabelLearning: '',
        audioLabelLexeme: lexemeToDraftFields(),
        optionsKnown: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 30,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        acceptedAnswersKnown: [''],
        appearance: { ...appearance },
        ...lexemeFields,
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
  const promptLexeme = lexemeToDraftFields('promptLexeme' in card ? card.promptLexeme : undefined);
  const audioUrl = 'audioUrl' in card ? (card.audioUrl ?? '') : '';

  switch (card.kind) {
    case 'select':
      return {
        kind: 'select',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        optionsLexemes: card.optionsLearning.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'memory':
      return {
        kind: 'memory',
        title: card.title,
        promptKnown: card.promptKnown,
        pairs: card.pairs.map((pair) => ({
          known: pair.known,
          learning: pair.learning,
          learningLexeme: lexemeToDraftFields(
            pair.learningLexeme ?? { primary: pair.learning, script: 'latn' },
          ),
        })),
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        symbols: [...card.symbols],
        symbolLexemes: card.symbols.map((symbol, index) =>
          lexemeToDraftFields(card.symbolLexemes?.[index] ?? { primary: symbol, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        audioLabelLearning: card.audioLabelLearning,
        audioLabelLexeme: lexemeToDraftFields(
          card.promptLexeme ?? { primary: card.audioLabelLearning, script: 'latn' },
        ),
        optionsKnown: [...card.optionsKnown],
        optionsLexemes: card.optionsKnown.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        optionsLexemes: card.optionsLearning.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        timeLimitSec: card.timeLimitSec,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: card.title,
        direction: card.direction,
        promptKnown: card.promptKnown,
        acceptedAnswersKnown: [...card.acceptedAnswersKnown],
        appearance,
        promptLexeme,
        audioUrl,
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
