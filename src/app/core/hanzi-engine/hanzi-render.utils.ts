import type { HanziPoint } from './hanzi-character.types';
import type { HanziPositioner } from './hanzi-positioner';

/** SVG transform для paths в MMH-координатах поверх canvas. */
export function resolveHanziSvgGroupTransform(positioner: HanziPositioner): string {
  return `translate(${positioner.xOffset}, ${positioner.yOffset}) scale(${positioner.scale}, ${-positioner.scale})`;
}

export function medianToSvgPath(points: readonly HanziPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first!.x} ${first!.y} ${segments}`.trim();
}

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
