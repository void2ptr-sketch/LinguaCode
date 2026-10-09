/** Practice mode for draw cards: different ways to practice character drawing. */
export type DrawPracticeMode =
  | 'freehand'
  | 'memory'
  | 'tracing'
  | 'hints'
  | 'stroke-order'
  | 'radicals';

/** Canvas mode during a session (switchable on a card). */
export type DrawCanvasMode = 'memory' | 'tracing' | 'hints' | 'stroke-order' | 'radicals';

/** A single stroke guide for character drawing practice. */
export type DrawStrokeGuide = {
  order: number;
  /** SVG path in viewBox 0 0 100 100. */
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

export const DRAW_CANVAS_MODE_LABELS: Record<DrawCanvasMode, string> = {
  memory: 'По памяти',
  tracing: 'Трассировка',
  hints: 'С подсказками',
  'stroke-order': 'Порядок черт',
  radicals: 'Радикалы',
};

export const DRAW_CANVAS_MODES: readonly DrawCanvasMode[] = [
  'memory',
  'tracing',
  'hints',
  'stroke-order',
  'radicals',
];
