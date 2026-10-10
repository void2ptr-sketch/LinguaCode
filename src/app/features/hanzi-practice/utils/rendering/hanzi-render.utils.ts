import type { HanziPoint } from '../../models/hanzi-character.types';
import type { HanziPositioner } from '../positioning/hanzi-positioner';

/**
 * Generates an SVG transform string for rendering Hanzi paths in MMH coordinates over a canvas.
 *
 * @param positioner - The HanziPositioner instance.
 * @returns An SVG `transform` attribute string.
 * @remarks
 * Equivalent to HanziWriter's `getScalingTransform` for consistent rendering.
 */
export function resolveHanziSvgGroupTransform(positioner: HanziPositioner): string {
  const translateY = positioner.height - positioner.yOffset;
  return `translate(${positioner.xOffset}, ${translateY}) scale(${positioner.scale}, ${-positioner.scale})`;
}

/**
 * Applies a canvas transform to map MMH stroke paths to the same position as the ghost SVG.
 *
 * @param context - The 2D canvas rendering context.
 * @param positioner - The HanziPositioner instance.
 * @remarks
 * Uses `context.transform()` to scale and translate so that Path2D strokes
 * render at the same position as the SVG ghost character.
 */
export function applyHanziCanvasPathTransform(
  context: CanvasRenderingContext2D,
  positioner: HanziPositioner,
): void {
  const translateY = positioner.height - positioner.yOffset;
  context.transform(positioner.scale, 0, 0, -positioner.scale, positioner.xOffset, translateY);
}

/**
 * Converts a polyline of points into an SVG `d` path string.
 *
 * @param points - The array of points forming the polyline.
 * @returns An SVG path `d` string using `M` and `L` segments, or an empty string for empty input.
 */
export function medianToSvgPath(points: readonly HanziPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first!.x} ${first!.y} ${segments}`.trim();
}

/**
 * Determines a label position for a stroke's median point.
 *
 * @param points - The array of points forming the stroke median.
 * @returns The midpoint point for multi-point strokes, the single point for one-point strokes,
 *          or a fallback `{x: 512, y: 388}` for empty input.
 */
export function medianLabelPoint(points: readonly HanziPoint[]): HanziPoint {
  if (points.length === 0) {
    return { x: 512, y: 388 };
  }

  if (points.length === 1) {
    return points[0]!;
  }

  const midIndex = Math.floor(points.length / 2);
  return points[midIndex]!;
}
