export type DrawPracticeMode =
  | 'freehand'
  | 'memory'
  | 'tracing'
  | 'hints'
  | 'stroke-order'
  | 'radicals';

/** Режим canvas во время сессии (переключается на карточке). */
export type DrawCanvasMode = 'memory' | 'tracing' | 'hints' | 'stroke-order' | 'radicals';

export type DrawStrokeGuide = {
  order: number;
  /** SVG path in viewBox 0 0 100 100 */
  path: string;
};

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
