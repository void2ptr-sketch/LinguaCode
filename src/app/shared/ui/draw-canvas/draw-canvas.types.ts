/**
 * A 2D point on the draw canvas.
 *
 * @remarks
 * Coordinates are in canvas pixel space.
 */
export type DrawCanvasPoint = {
  x: number;
  y: number;
};

/**
 * A sequence of points forming a drawn stroke.
 *
 * @remarks
 * Immutable array of `DrawCanvasPoint` objects representing one continuous stroke.
 */
export type DrawStrokePath = readonly DrawCanvasPoint[];

/**
 * Grade for a memorized stroke comparison.
 *
 * - `correct` — the drawn stroke matches the reference.
 * - `incorrect` — the drawn stroke does not match the reference.
 */
export type DrawMemoryStrokeGrade = 'correct' | 'incorrect';
