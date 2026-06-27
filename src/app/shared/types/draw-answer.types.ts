import type { DrawCanvasMode } from '../../core/models/draw-practice.types';
import type { DrawStrokePath } from '../../shared/components/draw-canvas/draw-canvas.types';

export type DrawAnswerPayload = {
  canvasMode: DrawCanvasMode;
  canvasSize: { width: number; height: number };
  strokesByCharacter: readonly (readonly DrawStrokePath[])[];
};
