import type { Card, MemoryPair, OptionCard } from '../models';
import type { PhoneticLexeme } from '../models/phonetic-content.types';
import type { CardDirection } from '../models/language-pair.types';

export type ResolvedOptionCard = {
  prompt: string;
  promptLexeme?: PhoneticLexeme;
  options: readonly string[];
  optionLexemes?: readonly (PhoneticLexeme | undefined)[];
  correctIndex: number;
};

export type ResolvedMemoryPair = {
  left: string;
  right: string;
  leftLexeme?: PhoneticLexeme;
  rightLexeme?: PhoneticLexeme;
  pairId: string;
};

/** В сессии направление задаёт toggle; `card.direction` — только default при старте. */
export function effectiveCardDirection(
  _cardDirection: CardDirection | undefined,
  sessionDirection: CardDirection,
): CardDirection {
  return sessionDirection;
}

export function cardDefaultDirection(card: Card): CardDirection {
  if ('direction' in card && card.direction) {
    return card.direction;
  }

  return 'known-to-learning';
}

export function extractQuotedLemma(text: string): string | null {
  const match = text.match(/[«"']([^»"']+)[»"']/);
  return match?.[1]?.trim() || null;
}

export function resolveOptionCard(card: OptionCard, direction: CardDirection): ResolvedOptionCard {
  if (direction === 'known-to-learning') {
    return resolveKnownToLearningOptionCard(card);
  }

  return resolveLearningToKnownOptionCard(card);
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

  if (card.kind === 'keyboard') {
    return resolveKeyboardPrompt(card, direction);
  }

  if (isOptionCard(card)) {
    return resolveOptionCard(card, direction).prompt;
  }

  if (card.kind === 'tone') {
    return card.promptKnown;
  }

  return '';
}

export function resolveKeyboardPrompt(
  card: Extract<Card, { kind: 'keyboard' }>,
  direction: CardDirection,
): string {
  if (direction === 'known-to-learning') {
    return (
      card.acceptedAnswersKnown[0]?.trim() ||
      card.promptLexeme?.glossKnown?.trim() ||
      extractQuotedLemma(card.promptKnown) ||
      card.promptKnown
    );
  }

  return (
    extractQuotedLemma(card.promptKnown) ||
    card.promptLexeme?.primary.trim() ||
    card.promptKnown
  );
}

export function resolveKeyboardAcceptedAnswers(
  card: Extract<Card, { kind: 'keyboard' }>,
  direction: CardDirection,
): readonly string[] {
  if (direction === 'known-to-learning') {
    if (card.acceptedAnswersLearning?.length) {
      return card.acceptedAnswersLearning;
    }

    const learningLemma = extractQuotedLemma(card.promptKnown) ?? card.promptLexeme?.primary.trim();
    return learningLemma ? [learningLemma] : card.acceptedAnswersKnown;
  }

  return card.acceptedAnswersKnown;
}

function resolveKnownToLearningOptionCard(card: OptionCard): ResolvedOptionCard {
  if (card.kind === 'sound') {
    return {
      prompt: `${card.promptKnown} (${card.audioLabelLearning})`,
      promptLexeme: card.promptLexeme,
      options: card.optionsKnown,
      optionLexemes: card.optionsLexemes,
      correctIndex: card.correctIndex,
    };
  }

  const options =
    card.kind === 'select' || card.kind === 'timed' || card.kind === 'reading'
      ? card.optionsLearning
      : card.symbols;

  return {
    prompt: card.promptKnown,
    promptLexeme: card.promptLexeme,
    options,
    optionLexemes: card.kind === 'symbol' ? card.symbolLexemes : card.optionsLexemes,
    correctIndex: card.correctIndex,
  };
}

function resolveLearningToKnownOptionCard(card: OptionCard): ResolvedOptionCard {
  if (card.kind === 'sound') {
    return {
      prompt: card.audioLabelLearning,
      promptLexeme: card.promptLexeme,
      options: card.optionsKnown,
      optionLexemes: card.optionsLexemes,
      correctIndex: card.correctIndex,
    };
  }

  const learningOptions =
    card.kind === 'select' || card.kind === 'timed' || card.kind === 'reading'
      ? card.optionsLearning
      : card.symbols;

  const learningLexemes =
    card.kind === 'symbol' ? card.symbolLexemes : card.optionsLexemes;

  const prompt = learningOptions[card.correctIndex] ?? card.promptKnown;
  const promptLexeme = learningLexemes?.[card.correctIndex];

  const knownOptions = resolveParallelKnownOptions(
    learningOptions,
    card.optionsKnown,
    learningLexemes,
    card.promptKnown,
    card.promptLexeme,
    card.correctIndex,
  );

  return {
    prompt,
    promptLexeme,
    options: knownOptions,
    optionLexemes: buildKnownOptionLexemes(knownOptions, card.promptLexeme, card.correctIndex),
    correctIndex: card.correctIndex,
  };
}

function resolveParallelKnownOptions(
  learningOptions: readonly string[],
  knownOptions: readonly string[] | undefined,
  learningLexemes: readonly PhoneticLexeme[] | undefined,
  promptKnown: string,
  promptLexeme: PhoneticLexeme | undefined,
  correctIndex: number,
): readonly string[] {
  if (knownOptions && knownOptions.length === learningOptions.length) {
    return knownOptions;
  }

  const glossOptions = learningLexemes?.map((item) => item.glossKnown?.trim() ?? '');
  if (
    glossOptions &&
    glossOptions.length === learningOptions.length &&
    glossOptions.every(Boolean)
  ) {
    return glossOptions;
  }

  const quoted = extractQuotedLemma(promptKnown) ?? promptLexeme?.glossKnown?.trim();
  if (quoted) {
    return learningOptions.map((_, index) => (index === correctIndex ? quoted : `—`));
  }

  return learningOptions;
}

function buildKnownOptionLexemes(
  knownOptions: readonly string[],
  promptLexeme: PhoneticLexeme | undefined,
  correctIndex: number,
): readonly (PhoneticLexeme | undefined)[] {
  return knownOptions.map((option, index) => {
    if (index !== correctIndex) {
      return undefined;
    }

    if (promptLexeme?.glossKnown === option) {
      return promptLexeme;
    }

    return { primary: option, script: 'latn' as const, glossKnown: option };
  });
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
