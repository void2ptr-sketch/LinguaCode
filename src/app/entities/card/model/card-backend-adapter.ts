import type { Card, CardBase } from './card.types';
import type {
  BackendCardDto,
  BackendCardKind,
  BackendCardDifficulty,
  ParsedCardContent,
} from './card-backend-dto.types';

/**
 * Maps uppercase backend enum values to lowercase frontend CardKind.
 * Also handles already-lowercase frontend kinds (from mock data).
 */
function mapCardKind(backendKind: BackendCardKind): Card['kind'] {
  const map: Record<BackendCardKind, Card['kind']> = {
    SELECT: 'select',
    CODE_SELECT: 'code-select',
    MEMORY: 'memory',
    SYMBOL: 'symbol',
    SOUND: 'sound',
    TIMED: 'timed',
    KEYBOARD: 'keyboard',
    DRAW: 'draw',
    TONE: 'tone',
    READING: 'reading',
    FLIP: 'flip',
    CLOZE: 'cloze',
    CODE_TRACE: 'code-trace',
  };
  // If already lowercase (frontend format from mock), return as-is
  const lower = String(backendKind).toLowerCase();
  if (lower === backendKind) {
    return lower as Card['kind'];
  }
  return map[backendKind];
}

/**
 * Maps uppercase backend difficulty to lowercase frontend difficulty.
 */
function mapDifficulty(backendDiff: BackendCardDifficulty | null): string | undefined {
  if (!backendDiff) return undefined;
  const map: Record<BackendCardDifficulty, string> = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  };
  return map[backendDiff];
}

/**
 * Parses the JSONB `content` string into a structured `ParsedCardContent`.
 *
 * @remarks
 * Each card kind has its own JSON structure stored in the `content` field.
 * This function parses and validates the structure.
 *
 * @throws Error if JSON is invalid or required fields are missing.
 */
function parseCardContent(dto: BackendCardDto): ParsedCardContent {
  try {
    // When content is already a structured object (e.g., from mock interceptor
    // returning a frontend Card directly), use it as-is instead of parsing.
    const rawContent = dto.content;
    const parsed: Record<string, unknown> =
      typeof rawContent === 'string' ? JSON.parse(rawContent) : (rawContent as Record<string, unknown>);

    // Normalize kind to uppercase for the switch statement (mock data may have lowercase)
    const kind = String(parsed['kind'] ?? dto.kind).toUpperCase() as BackendCardKind;
    parsed['kind'] = kind;

    // Helper to safely access parsed properties
    const get = (key: string): unknown => parsed[key];
    const getString = (key: string, fallback = ''): string => String(get(key) ?? fallback);
    const getNumber = (key: string, fallback = 0): number => {
      const val = get(key);
      return typeof val === 'number' ? val : fallback;
    };

    switch (dto.kind) {
      case 'SELECT':
        return {
          kind: 'SELECT',
          promptKnown: getString('promptKnown'),
          optionsLearning: Array.isArray(get('optionsLearning'))
            ? (get('optionsLearning') as string[]).map(String)
            : [],
          correctIndex: getNumber('correctIndex'),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'CODE_SELECT': {
        const prompt = get('prompt') as { code?: string; language?: string } | undefined;
        const options = get('options') as { code?: string; language?: string }[] | undefined;
        return {
          kind: 'CODE_SELECT',
          caption: get('caption') ? String(get('caption')) : undefined,
          prompt: {
            code: String(prompt?.code ?? ''),
            language: String(prompt?.language ?? 'plain'),
          },
          options: (options ?? []).map((opt) => ({
            code: String(opt.code ?? ''),
            language: String(opt.language ?? 'plain'),
          })),
          correctIndex: getNumber('correctIndex'),
        };
      }

      case 'MEMORY':
        return {
          kind: 'MEMORY',
          promptKnown: getString('promptKnown'),
          pairs: Array.isArray(get('pairs'))
            ? (get('pairs') as unknown[]).map((pair: unknown) => {
                const p = pair as { known?: string; learning?: string; front?: string; back?: string };
                return {
                  known: String(p.known ?? p.back ?? ''),
                  learning: String(p.learning ?? p.front ?? ''),
                };
              })
            : [],
        };

      case 'SYMBOL':
        return {
          kind: 'SYMBOL',
          promptKnown: getString('promptKnown'),
          symbols: Array.isArray(get('symbols')) ? (get('symbols') as string[]).map(String) : [],
          correctIndex: getNumber('correctIndex'),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'SOUND':
        return {
          kind: 'SOUND',
          promptKnown: getString('promptKnown'),
          audioLabelLearning: getString('audioLabelLearning'),
          optionsKnown: Array.isArray(get('optionsKnown')) ? (get('optionsKnown') as string[]).map(String) : [],
          correctIndex: getNumber('correctIndex'),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'TIMED':
        return {
          kind: 'TIMED',
          promptKnown: getString('promptKnown'),
          optionsLearning: Array.isArray(get('optionsLearning'))
            ? (get('optionsLearning') as string[]).map(String)
            : [],
          correctIndex: getNumber('correctIndex'),
          timeLimitSec: (() => {
            const val = get('timeLimitSec');
            return typeof val === 'number' ? val : 30;
          })(),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'KEYBOARD':
        return {
          kind: 'KEYBOARD',
          promptKnown: getString('promptKnown'),
          acceptedAnswers: Array.isArray(get('acceptedAnswers'))
            ? (get('acceptedAnswers') as string[]).map(String)
            : [],
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'DRAW':
        return {
          kind: 'DRAW',
          promptKnown: getString('promptKnown'),
          referenceHintKnown: getString('referenceHintKnown'),
          meaningKnown: get('meaningKnown') ? String(get('meaningKnown')) : undefined,
        };

      case 'TONE':
        return {
          kind: 'TONE',
          promptKnown: getString('promptKnown'),
          syllableBase: getString('syllableBase'),
          toneOptions: Array.isArray(get('toneOptions')) ? (get('toneOptions') as string[]).map(String) : [],
          correctIndex: getNumber('correctIndex'),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'READING':
        return {
          kind: 'READING',
          promptKnown: getString('promptKnown'),
          optionsLearning: Array.isArray(get('optionsLearning'))
            ? (get('optionsLearning') as string[]).map(String)
            : [],
          correctIndex: getNumber('correctIndex'),
          direction: get('direction') ? String(get('direction')) : undefined,
        };

      case 'FLIP':
        return {
          kind: 'FLIP',
          front: getString('front'),
          back: getString('back'),
        };

      case 'CLOZE':
        return {
          kind: 'CLOZE',
          promptKnown: getString('promptKnown'),
          correctAnswer: getString('correctAnswer'),
          options: Array.isArray(get('options')) ? (get('options') as string[]).map(String) : undefined,
          correctIndex: get('correctIndex') !== undefined ? getNumber('correctIndex') : undefined,
        };

      case 'CODE_TRACE': {
        const code = get('code') as { code?: string; language?: string } | undefined;
        return {
          kind: 'CODE_TRACE',
          caption: get('caption') ? String(get('caption')) : undefined,
          question: get('question') ? String(get('question')) : undefined,
          code: {
            code: String(code?.code ?? ''),
            language: String(code?.language ?? 'plain'),
          },
          outputOptions: Array.isArray(get('outputOptions'))
            ? (get('outputOptions') as string[]).map(String)
            : [],
          correctIndex: getNumber('correctIndex'),
        };
      }

      default:
        throw new Error(`Unknown card kind: ${dto.kind}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to parse card content for card ${dto.id} (kind: ${dto.kind}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Parses the JSONB `tags` string into a string array.
 */
function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Builds the common `CardBase` fields from a backend DTO.
 */
function buildCardBase(dto: BackendCardDto): CardBase {
  return {
    id: dto.id,
    kind: mapCardKind(dto.kind),
    title: dto.title,
    appearance: {
      theme: 'default',
      fontSize: 'md',
    },
  };
}

/**
 * Adapter for converting backend `BackendCardDto` (JSONB content) to frontend `Card` types.
 *
 * @remarks
 * The backend stores card-specific data as a JSONB string in the `content` field.
 * This adapter parses the JSON and constructs the appropriate rich card type
 * based on the `kind` field.
 *
 * @example
 * ```ts
 * const backendDto: BackendCardDto = {
 *   id: '123',
 *   title: '猫',
 *   kind: 'SELECT',
 *   content: '{"promptKnown":"猫","optionsLearning":["cat","dog","bird"],"correctIndex":0}',
 *   tags: '["hsk1"]',
 *   difficulty: 'BEGINNER',
 *   createdAt: '2026-10-23T00:00:00Z',
 *   updatedAt: '2026-10-23T00:00:00Z',
 * };
 *
 * const card = CardBackendAdapter.toCard(backendDto);
 * // card is now a SelectCard with parsed fields
 * ```
 */
export const CardBackendAdapter = {
  /**
   * Converts a single backend DTO to a frontend Card.
   *
   * @remarks
   * If the input is already a frontend `Card` (e.g., from mock interceptor),
   * it is returned as-is without transformation.
   */
  toCard(dto: BackendCardDto): Card {
    // Fast-path: if content is already a structured object (mock returns frontend Card),
    // the dto itself is likely a frontend Card — return as-is.
    if (typeof dto.content !== 'string') {
      return dto as unknown as Card;
    }

    const parsed = parseCardContent(dto);
    const base = buildCardBase(dto);
    const tags = parseTags(dto.tags);
    const difficulty = mapDifficulty(dto.difficulty);

    // Build card with common fields
    const card = {
      ...base,
      difficulty,
      tags,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    } as unknown as Record<string, unknown>;

    // Add kind-specific fields and return
    switch (parsed.kind) {
      case 'SELECT':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          optionsLearning: parsed.optionsLearning,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'CODE_SELECT':
        return {
          ...card,
          caption: parsed.caption,
          prompt: parsed.prompt,
          options: parsed.options,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'MEMORY':
        return {
          ...card,
          promptKnown: parsed.promptKnown,
          pairs: parsed.pairs,
        } as unknown as Card;

      case 'SYMBOL':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          symbols: parsed.symbols,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'SOUND':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          audioLabelLearning: parsed.audioLabelLearning,
          optionsKnown: parsed.optionsKnown,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'TIMED':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          optionsLearning: parsed.optionsLearning,
          correctIndex: parsed.correctIndex,
          timeLimitSec: parsed.timeLimitSec,
        } as unknown as Card;

      case 'KEYBOARD':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          acceptedAnswersKnown: parsed.acceptedAnswers,
        } as unknown as Card;

      case 'DRAW':
        return {
          ...card,
          promptKnown: parsed.promptKnown,
          referenceHintKnown: parsed.referenceHintKnown,
          meaningKnown: parsed.meaningKnown,
        } as unknown as Card;

      case 'TONE':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          syllableBase: parsed.syllableBase,
          toneOptions: parsed.toneOptions,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'READING':
        return {
          ...card,
          direction: parsed.direction ?? 'known-to-learning',
          promptKnown: parsed.promptKnown,
          optionsLearning: parsed.optionsLearning,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'FLIP':
        return {
          ...card,
          front: parsed.front,
          back: parsed.back,
        } as unknown as Card;

      case 'CLOZE':
        return {
          ...card,
          promptKnown: parsed.promptKnown,
          correctAnswer: parsed.correctAnswer,
          options: parsed.options,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;

      case 'CODE_TRACE':
        return {
          ...card,
          caption: parsed.caption,
          question: parsed.question,
          code: parsed.code,
          outputOptions: parsed.outputOptions,
          correctIndex: parsed.correctIndex,
        } as unknown as Card;
    }
  },

  /**
   * Converts an array of backend DTOs to frontend Cards.
   */
  toCards(dtos: readonly BackendCardDto[]): Card[] {
    return dtos.map((dto) => this.toCard(dto));
  },
};
