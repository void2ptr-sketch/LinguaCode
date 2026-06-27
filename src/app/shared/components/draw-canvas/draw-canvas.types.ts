export type DrawCanvasPoint = {
  x: number;
  y: number;
};

export type DrawStrokePath = readonly DrawCanvasPoint[];

export type DrawMemoryStrokeGrade = 'correct' | 'incorrect';
