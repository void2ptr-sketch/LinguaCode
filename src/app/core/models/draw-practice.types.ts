export type DrawPracticeMode = 'freehand' | 'stroke-order' | 'radicals';

export type DrawStrokeGuide = {
  order: number;
  /** SVG path in viewBox 0 0 100 100 */
  path: string;
};
