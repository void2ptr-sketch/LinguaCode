/**
 * Backend DTO types — exact match for Spring Boot CardDto.
 *
 * @remarks
 * These types represent the wire format returned by the backend API.
 * The `content` and `tags` fields are JSONB strings that must be
 * parsed and transformed by `CardContentAdapter` into rich frontend types.
 *
 * @see card-backend-adapter.ts
 */

/**
 * Card difficulty levels — matches backend `CardDifficulty` enum.
 */
export type BackendCardDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Card kind — matches backend `CardKind` enum (uppercase).
 */
export type BackendCardKind =
  | 'SELECT'
  | 'CODE_SELECT'
  | 'MEMORY'
  | 'SYMBOL'
  | 'SOUND'
  | 'TIMED'
  | 'KEYBOARD'
  | 'DRAW'
  | 'TONE'
  | 'READING'
  | 'FLIP'
  | 'CLOZE'
  | 'CODE_TRACE';

/**
 * Backend card DTO — the exact shape returned by `GET /api/v1/cards/{id}`.
 *
 * @remarks
 * `content` is a JSONB string containing kind-specific data.
 * `tags` is a JSONB string containing an array of tag strings.
 */
export type BackendCardDto = {
  /** Unique card identifier (UUID). */
  id: string;
  /** Card title. */
  title: string;
  /** Card kind (uppercase, e.g. 'SELECT'). */
  kind: BackendCardKind;
  /** JSONB string with card-specific content (real API) or structured object (mock). */
  content: string | Record<string, unknown>;
  /** JSONB string with tags array. */
  tags: string;
  /** Difficulty level (uppercase). */
  difficulty: BackendCardDifficulty | null;
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
  /** Last update timestamp (ISO 8601). */
  updatedAt: string;
};

/**
 * Paginated backend response for list/search endpoints.
 *
 * @remarks
 * Matches `ApiListResponse<BackendCardDto>` from the backend.
 */
export type BackendCardPage = {
  /** Array of card DTOs. */
  data: readonly BackendCardDto[];
  /** Total number of items. */
  total: number;
};

/**
 * Parsed content payload for each card kind.
 *
 * @remarks
 * After parsing `BackendCardDto.content`, this union represents
 * the structured data for each kind. Used internally by the adapter.
 */
export type ParsedCardContent =
  | { kind: 'SELECT'; promptKnown: string; optionsLearning: string[]; correctIndex: number; direction?: string }
  | { kind: 'CODE_SELECT'; caption?: string; prompt: { code: string; language: string }; options: { code: string; language: string }[]; correctIndex: number }
  | { kind: 'MEMORY'; promptKnown: string; pairs: { known: string; learning: string }[] }
  | { kind: 'SYMBOL'; promptKnown: string; symbols: string[]; correctIndex: number; direction?: string }
  | { kind: 'SOUND'; promptKnown: string; audioLabelLearning: string; optionsKnown: string[]; correctIndex: number; direction?: string }
  | { kind: 'TIMED'; promptKnown: string; optionsLearning: string[]; correctIndex: number; timeLimitSec: number; direction?: string }
  | { kind: 'KEYBOARD'; promptKnown: string; acceptedAnswers: string[]; direction?: string }
  | { kind: 'DRAW'; promptKnown: string; referenceHintKnown: string; meaningKnown?: string }
  | { kind: 'TONE'; promptKnown: string; syllableBase: string; toneOptions: string[]; correctIndex: number; direction?: string }
  | { kind: 'READING'; promptKnown: string; optionsLearning: string[]; correctIndex: number; direction?: string }
  | { kind: 'FLIP'; front: string; back: string }
  | { kind: 'CLOZE'; promptKnown: string; correctAnswer: string; options?: string[]; correctIndex?: number }
  | { kind: 'CODE_TRACE'; caption?: string; question?: string; code: { code: string; language: string }; outputOptions: string[]; correctIndex: number };
