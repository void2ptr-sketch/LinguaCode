import type {
  Card,
  DrawCard,
  KeyboardCard,
  MemoryCard,
  MemoryPair,
  SelectCard,
  SoundCard,
  SymbolCard,
  TimedCard,
} from '../models';
import type { CardDirection } from '../models/language-pair.types';

type LegacyMemoryPair = {
  front?: string;
  back?: string;
  known?: string;
  learning?: string;
};

type LegacyCard = Card & {
  question?: string;
  options?: readonly string[];
  prompt?: string;
  pairs?: readonly LegacyMemoryPair[];
  audioLabel?: string;
  acceptedAnswers?: readonly string[];
  referenceHint?: string;
};

const DEFAULT_DIRECTION: CardDirection = 'known-to-learning';

function normalizeMemoryPair(pair: LegacyMemoryPair): MemoryPair {
  if (pair.known && pair.learning) {
    return { known: pair.known, learning: pair.learning };
  }

  return {
    known: pair.back ?? '',
    learning: pair.front ?? '',
  };
}

export function normalizeLegacyCard(raw: LegacyCard): Card {
  switch (raw.kind) {
    case 'select': {
      const card = raw as SelectCard & LegacyCard;
      if (card.promptKnown && card.optionsLearning) {
        return card;
      }

      return {
        ...card,
        direction: card.direction ?? DEFAULT_DIRECTION,
        promptKnown: card.promptKnown ?? card.question ?? '',
        optionsLearning: card.optionsLearning ?? card.options ?? [],
        correctIndex: card.correctIndex,
      };
    }
    case 'memory': {
      const card = raw as MemoryCard & LegacyCard;
      if (card.promptKnown && card.pairs.every((pair) => pair.known && pair.learning)) {
        return card;
      }

      return {
        ...card,
        promptKnown: card.promptKnown ?? card.prompt ?? '',
        pairs: (card.pairs ?? []).map(normalizeMemoryPair),
      };
    }
    case 'symbol': {
      const card = raw as SymbolCard & LegacyCard;
      return {
        ...card,
        direction: card.direction ?? DEFAULT_DIRECTION,
        promptKnown: card.promptKnown ?? card.prompt ?? '',
      };
    }
    case 'sound': {
      const card = raw as SoundCard & LegacyCard;
      return {
        ...card,
        direction: card.direction ?? DEFAULT_DIRECTION,
        promptKnown: card.promptKnown ?? card.prompt ?? '',
        audioLabelLearning: card.audioLabelLearning ?? card.audioLabel ?? '',
        optionsKnown: card.optionsKnown ?? card.options ?? [],
      };
    }
    case 'timed': {
      const card = raw as TimedCard & LegacyCard;
      return {
        ...card,
        direction: card.direction ?? DEFAULT_DIRECTION,
        promptKnown: card.promptKnown ?? card.question ?? '',
        optionsLearning: card.optionsLearning ?? card.options ?? [],
      };
    }
    case 'keyboard': {
      const card = raw as KeyboardCard & LegacyCard;
      return {
        ...card,
        direction: card.direction ?? DEFAULT_DIRECTION,
        promptKnown: card.promptKnown ?? card.prompt ?? '',
        acceptedAnswersKnown: card.acceptedAnswersKnown ?? card.acceptedAnswers ?? [],
      };
    }
    case 'draw': {
      const card = raw as DrawCard & LegacyCard;
      return {
        ...card,
        promptKnown: card.promptKnown ?? card.prompt ?? '',
        referenceHintKnown: card.referenceHintKnown ?? card.referenceHint ?? '',
      };
    }
    default:
      return raw;
  }
}

export function normalizeLegacyCards(cards: readonly LegacyCard[]): readonly Card[] {
  return cards.map(normalizeLegacyCard);
}
