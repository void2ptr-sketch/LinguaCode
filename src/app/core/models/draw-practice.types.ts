/** Practice mode for draw cards: different ways to practice character drawing. */
export type DrawPracticeMode =
  | 'freehand'
  | 'memory'
  | 'tracing'
  | 'hints'
  | 'stroke-order'
  | 'radicals';

/**
 * Canvas mode during a session (switchable on a card).
 *
 * @remarks
 * `memory` — draw from memory; `tracing` — trace over guide strokes;
 * `hints` — draw with partial hints; `stroke-order` — practice stroke order; `radicals` — practice radicals.
 */
export type DrawCanvasMode = 'memory' | 'tracing' | 'hints' | 'stroke-order' | 'radicals';

/**
 * A single stroke guide for character drawing practice.
 *
 * @remarks
 * Used in draw cards to show the user the correct stroke order and shape.
 * SVG paths are in the 100x100 viewBox coordinate system.
 */
export type DrawStrokeGuide = {
  /** Zero-based stroke order index. */
  order: number;
  /** SVG path string in viewBox 0 0 100 100. */
  path: string;
};

/**
 * A target character for draw cards with associated metadata.
 *
 * @remarks
 * Each tab in a draw card can have a different target character.
 */
export type DrawCharacterTarget = {
  character: string;
  pinyin?: string;
  zhuyin?: string;
  palladius?: string;
  glossKnown?: string;
  strokeGuides?: readonly DrawStrokeGuide[];
  radicalHint?: string;
  audioUrl?: string;
};

/**
 * Labels for draw canvas modes, displayed in the UI selector.
 *
 * @remarks
 * Keys are `DrawCanvasMode` values; values are Russian labels shown in the mode switcher.
 */
export const DRAW_CANVAS_MODE_LABELS: Record<DrawCanvasMode, string> = {
  memory: 'По памяти',
  tracing: 'Трассировка',
  hints: 'С подсказками',
  'stroke-order': 'Порядок черт',
  radicals: 'Радикалы',
};

/**
 * Ordered array of all draw canvas modes.
 *
 * @remarks
 * Used to render the mode selector in a consistent order.
 */
export const DRAW_CANVAS_MODES: readonly DrawCanvasMode[] = [
  'memory',
  'tracing',
  'hints',
  'stroke-order',
  'radicals',
];
