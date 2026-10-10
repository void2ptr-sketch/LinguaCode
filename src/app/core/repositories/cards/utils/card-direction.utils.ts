import type {
  Card,
  CardDirection,
  MemoryPair,
  OptionCard,
  ResolvedMemoryPair,
  ResolvedOptionCard,
} from '../../../models';
import type { PhoneticLexeme } from '../../../models';
/** В сессии направление задаёт toggle; `card.direction` — только default при старте. */
export function effectiveCardDirection(
  _cardDirection: CardDirection | undefined,
  sessionDirection: CardDirection,
): CardDirection {
  return sessionDirection;
}

/** Возвращает направление по умолчанию для карточки (`card.direction` или `'known-to-learning'`). */
export function cardDefaultDirection(card: Card): CardDirection {
  if ('direction' in card && card.direction) {
    return card.direction;
  }

  return 'known-to-learning';
}

/** Извлекает лемму из первых кавычек («, ", '») в строке. Возвращает `null`, если кавычек нет. */
export function extractQuotedLemma(text: string): string | null {
  const match = text.match(/[«"']([^»"']+)[»"']/);
  return match?.[1]?.trim() || null;
}

/**
 * Разрешает option-карточку в `ResolvedOptionCard` с учётом направления сессии.
 * Перенаправляет на `resolveKnownToLearningOptionCard` или `resolveLearningToKnownOptionCard`.
 */
export function resolveOptionCard(card: OptionCard, direction: CardDirection): ResolvedOptionCard {
  if (direction === 'known-to-learning') {
    return resolveKnownToLearningOptionCard(card);
  }

  return resolveLearningToKnownOptionCard(card);
}

/**
 * Разрешает массив memory-пар в `ResolvedMemoryPair[]` с учётом направления сессии.
 * Меняет местами `known`/`learning` поля в зависимости от направления.
 */
export function resolveMemoryPairs(
  pairs: readonly MemoryPair[],
  direction: CardDirection,
): readonly ResolvedMemoryPair[] {
  return pairs.map((pair, index) => ({
    pairId: String(index),
    left: direction === 'known-to-learning' ? pair.known : pair.learning,
    right: direction === 'known-to-learning' ? pair.learning : pair.known,
    leftLexeme: direction === 'known-to-learning' ? undefined : pair.learningLexeme,
    rightLexeme: direction === 'known-to-learning' ? pair.learningLexeme : undefined,
  }));
}

/**
 * Возвращает текст подсказки (prompt) для карточки с учётом направления сессии.
 * Для `memory`/`draw`/`tone` — всегда `promptKnown`; для `keyboard` и option-карточек — зависит от направления.
 */
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

/**
 * Возвращает текст подсказки для keyboard-карточки с учётом направления сессии.
 * В направлении `known-to-learning` приоритет у первого известного ответа, в обратном — у леммы.
 */
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
    extractQuotedLemma(card.promptKnown) || card.promptLexeme?.primary.trim() || card.promptKnown
  );
}

/**
 * Возвращает список допустимых ответов для keyboard-карточки с учётом направления сессии.
 * В направлении `known-to-learning` пытается вывести ответ на изучаемом языке из известной части.
 */
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
  if (card.kind === 'code-select') {
    return {
      prompt: card.caption ?? card.prompt.code,
      options: card.options.map((option) => option.code),
      correctIndex: card.correctIndex,
    };
  }

  if (card.kind === 'sound') {
    return {
      prompt: card.promptKnown,
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
  if (card.kind === 'code-select') {
    return resolveKnownToLearningOptionCard(card);
  }

  if (card.kind === 'sound') {
    return {
      prompt: card.promptKnown,
      options: card.optionsKnown,
      optionLexemes: card.optionsLexemes,
      correctIndex: card.correctIndex,
    };
  }

  const learningOptions =
    card.kind === 'select' || card.kind === 'timed' || card.kind === 'reading'
      ? card.optionsLearning
      : card.symbols;

  const learningLexemes = card.kind === 'symbol' ? card.symbolLexemes : card.optionsLexemes;

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
    optionLexemes: buildKnownOptionLexemes(
      knownOptions,
      card.promptLexeme,
      card.correctIndex,
      learningLexemes,
    ),
    correctIndex: card.correctIndex,
  };
}

/**
 * Выводит варианты на известном языке из лексем и известных опций.
 * Возвращает `undefined`, если данные для слияния отсутствуют.
 */
export function deriveKnownOptionsFromLexemes(
  learningOptions: readonly string[],
  learningLexemes: readonly PhoneticLexeme[] | undefined,
  knownOptions: readonly string[] | undefined,
): readonly string[] | undefined {
  const merged = mergeKnownOptionsByIndex(learningOptions, knownOptions, learningLexemes);
  return merged ?? undefined;
}

function resolveParallelKnownOptions(
  learningOptions: readonly string[],
  knownOptions: readonly string[] | undefined,
  learningLexemes: readonly PhoneticLexeme[] | undefined,
  promptKnown: string,
  promptLexeme: PhoneticLexeme | undefined,
  correctIndex: number,
): readonly string[] {
  const merged = mergeKnownOptionsByIndex(learningOptions, knownOptions, learningLexemes);
  if (merged) {
    return merged;
  }

  const quoted = extractQuotedLemma(promptKnown) ?? promptLexeme?.glossKnown?.trim();
  if (quoted) {
    const withQuoted = learningOptions.map((_, index) => {
      if (index === correctIndex) {
        return quoted;
      }

      const gloss = learningLexemes?.[index]?.glossKnown?.trim();
      if (gloss) {
        return gloss;
      }

      const known = knownOptions?.[index]?.trim();
      if (known) {
        return known;
      }

      return learningOptions[index] ?? '';
    });

    return withQuoted;
  }

  return learningOptions;
}

function mergeKnownOptionsByIndex(
  learningOptions: readonly string[],
  knownOptions: readonly string[] | undefined,
  learningLexemes: readonly PhoneticLexeme[] | undefined,
): readonly string[] | null {
  if (knownOptions && knownOptions.length === learningOptions.length) {
    return knownOptions;
  }

  const glossOptions = learningLexemes?.map((item) => item.glossKnown?.trim() ?? '');
  if (glossOptions && glossOptions.length === learningOptions.length) {
    const merged = glossOptions.map((gloss, index) => gloss || knownOptions?.[index]?.trim() || '');
    if (merged.every(Boolean)) {
      return merged;
    }
  }

  return null;
}

function buildKnownOptionLexemes(
  knownOptions: readonly string[],
  _promptLexeme: PhoneticLexeme | undefined,
  _correctIndex: number,
  learningLexemes?: readonly PhoneticLexeme[],
): readonly (PhoneticLexeme | undefined)[] {
  return knownOptions.map((option, index) => {
    const trimmed = option.trim();
    if (!trimmed) {
      return undefined;
    }

    const learningLexeme = learningLexemes?.[index];
    return {
      primary: trimmed,
      script: 'latn' as const,
      glossKnown: trimmed,
      ...(learningLexeme?.glossKnown?.trim() === trimmed && learningLexeme.ipa
        ? { ipa: learningLexeme.ipa }
        : {}),
    };
  });
}

function isOptionCard(card: Card): card is OptionCard {
  return (
    card.kind === 'select' ||
    card.kind === 'code-select' ||
    card.kind === 'symbol' ||
    card.kind === 'sound' ||
    card.kind === 'timed' ||
    card.kind === 'reading'
  );
}

/** Toggle «Известный ↔ новый» меняет задание только для этих kind. */
export function cardSupportsSessionDirection(card: Card | null | undefined): boolean {
  if (!card) {
    return false;
  }

  return card.kind !== 'draw' && card.kind !== 'tone' && card.kind !== 'code-select';
}
