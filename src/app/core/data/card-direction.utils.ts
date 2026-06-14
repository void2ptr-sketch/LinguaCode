import type { Card, MemoryPair, OptionCard } from '../models';
import type { PhoneticLexeme } from '../models/phonetic-content.types';
import type { CardDirection } from '../models/language-pair.types';

export type ResolvedOptionCard = {
  prompt: string;
  options: readonly string[];
  correctIndex: number;
};

export type ResolvedMemoryPair = {
  left: string;
  right: string;
  leftLexeme?: PhoneticLexeme;
  rightLexeme?: PhoneticLexeme;
  pairId: string;
};

export function effectiveCardDirection(
  cardDirection: CardDirection | undefined,
  sessionDirection: CardDirection,
): CardDirection {
  return cardDirection ?? sessionDirection;
}

export function resolveOptionCard(
  card: OptionCard,
  direction: CardDirection,
): ResolvedOptionCard {
  if (direction === 'known-to-learning') {
    if (card.kind === 'sound') {
      return {
        prompt: `${card.promptKnown} (${card.audioLabelLearning})`,
        options: card.optionsKnown,
        correctIndex: card.correctIndex,
      };
    }

    return {
      prompt: card.promptKnown,
      options:
        card.kind === 'select' || card.kind === 'timed' || card.kind === 'reading'
          ? card.optionsLearning
          : card.symbols,
      correctIndex: card.correctIndex,
    };
  }

  if (card.kind === 'sound') {
    return {
      prompt: card.audioLabelLearning,
      options: card.optionsKnown,
      correctIndex: card.correctIndex,
    };
  }

  return {
    prompt: card.promptKnown,
    options:
      card.kind === 'select' || card.kind === 'timed' || card.kind === 'reading'
        ? card.optionsLearning
        : card.symbols,
    correctIndex: card.correctIndex,
  };
}

export function resolveMemoryPairs(
  pairs: readonly MemoryPair[],
  direction: CardDirection,
): readonly ResolvedMemoryPair[] {
  return pairs.map((pair, index) => ({
    pairId: String(index),
    left: direction === 'known-to-learning' ? pair.known : pair.learning,
    right: direction === 'known-to-learning' ? pair.learning : pair.known,
    leftLexeme:
      direction === 'known-to-learning' ? undefined : pair.learningLexeme,
    rightLexeme:
      direction === 'known-to-learning' ? pair.learningLexeme : undefined,
  }));
}

export function resolveCardPrompt(card: Card, direction: CardDirection): string {
  if (card.kind === 'memory' || card.kind === 'draw') {
    return card.promptKnown;
  }

  if (isOptionCard(card)) {
    return resolveOptionCard(card, direction).prompt;
  }

  if (card.kind === 'keyboard') {
    return card.promptKnown;
  }

  if (card.kind === 'tone') {
    return card.promptKnown;
  }

  return '';
}

function isOptionCard(card: Card): card is OptionCard {
  return (
    card.kind === 'select' ||
    card.kind === 'symbol' ||
    card.kind === 'sound' ||
    card.kind === 'timed' ||
    card.kind === 'reading'
  );
}

export function resolveKeyboardAcceptedAnswers(
  card: Extract<Card, { kind: 'keyboard' }>,
  direction: CardDirection,
): readonly string[] {
  if (direction === 'known-to-learning') {
    return card.acceptedAnswersKnown;
  }

  return card.acceptedAnswersKnown;
}
