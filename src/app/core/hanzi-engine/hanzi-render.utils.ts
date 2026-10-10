import type { HanziPoint } from './hanzi-character.types';
import type { HanziPositioner } from './hanzi-positioner';

/** SVG transform для paths в MMH-координатах поверх canvas (как HanziWriter.getScalingTransform). */
export function resolveHanziSvgGroupTransform(positioner: HanziPositioner): string {
  const translateY = positioner.height - positioner.yOffset;
  return `translate(${positioner.xOffset}, ${translateY}) scale(${positioner.scale}, ${-positioner.scale})`;
}

/** MMH → canvas для заливки stroke.path (Path2D) в том же месте, что ghost SVG. */
export function applyHanziCanvasPathTransform(
  context: CanvasRenderingContext2D,
  positioner: HanziPositioner,
): void {
  const translateY = positioner.height - positioner.yOffset;
  context.transform(positioner.scale, 0, 0, -positioner.scale, positioner.xOffset, translateY);
}

/** Converts a polyline of points into an SVG `d` path string (`M` + `L` segments). Returns an empty string for empty input. */
export function medianToSvgPath(points: readonly HanziPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first!.x} ${first!.y} ${segments}`.trim();
}

/** Determines a label position for a stroke's median: the midpoint point, or the single point for one-point strokes. Returns a fallback for empty input. */
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
