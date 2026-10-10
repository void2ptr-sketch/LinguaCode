import type { DrawCanvasMode, DrawStrokePath } from '../../core/models';
/**
 * Payload submitted by the user when answering a draw card.
 *
 * @remarks
 * Contains the canvas mode, dimensions, and stroke paths grouped by character (tab).
 */
export type DrawAnswerPayload = {
  canvasMode: DrawCanvasMode;
  canvasSize: { width: number; height: number };
  strokesByCharacter: readonly (readonly DrawStrokePath[])[];
};
