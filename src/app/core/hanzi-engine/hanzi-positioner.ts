import {
  HANZI_CHARACTER_BOUNDS,
  type HanziCanvasTransform,
  type HanziCharacterJson,
  type HanziPoint,
  type HanziPositionerOptions,
} from './hanzi-character.types';

const PRE_SCALED_WIDTH = HANZI_CHARACTER_BOUNDS.maxX - HANZI_CHARACTER_BOUNDS.minX;
const PRE_SCALED_HEIGHT = HANZI_CHARACTER_BOUNDS.maxY - HANZI_CHARACTER_BOUNDS.minY;

/** Преобразует координаты MMH → canvas px (единый transform для ghost, guides, quiz). */
export class HanziPositioner {
  readonly padding: number;
  readonly width: number;
  readonly height: number;
  readonly xOffset: number;
  readonly yOffset: number;
  readonly scale: number;

  constructor(options: HanziPositionerOptions) {
    this.padding = options.padding ?? 20;
    this.width = options.width;
    this.height = options.height;

    const effectiveWidth = this.width - 2 * this.padding;
    const effectiveHeight = this.height - 2 * this.padding;
    const scaleX = effectiveWidth / PRE_SCALED_WIDTH;
    const scaleY = effectiveHeight / PRE_SCALED_HEIGHT;
    this.scale = Math.min(scaleX, scaleY);

    const xCenteringBuffer = this.padding + (effectiveWidth - this.scale * PRE_SCALED_WIDTH) / 2;
    const yCenteringBuffer = this.padding + (effectiveHeight - this.scale * PRE_SCALED_HEIGHT) / 2;

    this.xOffset = -1 * HANZI_CHARACTER_BOUNDS.minX * this.scale + xCenteringBuffer;
    this.yOffset = -1 * HANZI_CHARACTER_BOUNDS.minY * this.scale + yCenteringBuffer;
  }

  toCanvas(point: HanziPoint): HanziPoint {
    return {
      x: point.x * this.scale + this.xOffset,
      y: this.height - this.yOffset - point.y * this.scale,
    };
  }

  toCharacterSpace(point: HanziPoint): HanziPoint {
    return {
      x: (point.x - this.xOffset) / this.scale,
      y: (this.height - this.yOffset - point.y) / this.scale,
    };
  }

  toCanvasTransform(): HanziCanvasTransform {
    return {
      offsetX: this.xOffset,
      offsetY: this.yOffset,
      scale: this.scale,
    };
  }

  /** SVG group transform (user units 0–100), если viewBox совпадает с canvas size. */
  toSvgGroupTransform(viewBoxWidth: number, viewBoxHeight: number): string {
    const tx = (this.xOffset * viewBoxWidth) / Math.max(this.width, 1);
    const ty = ((this.height - this.yOffset) * viewBoxHeight) / Math.max(this.height, 1);
    const sx = (this.scale * viewBoxWidth) / Math.max(this.width, 1);
    const sy = (-1 * this.scale * viewBoxHeight) / Math.max(this.height, 1);
    return `translate(${tx} ${ty}) scale(${sx} ${sy})`;
  }
}

export function parseHanziMedianPoints(
  medians: HanziCharacterJson['medians'],
): readonly (readonly HanziPoint[])[] {
  return medians.map((stroke) => stroke.map(toHanziPoint));
}

function toHanziPoint(point: HanziPoint | readonly [number, number]): HanziPoint {
  if (typeof point === 'object' && point !== null && 'x' in point && 'y' in point) {
    return { x: point.x, y: point.y };
  }

  return { x: point[0] ?? 0, y: point[1] ?? 0 };
}

export function mapPointsToCanvas(
  points: readonly HanziPoint[],
  positioner: HanziPositioner,
): HanziPoint[] {
  return points.map((point) => positioner.toCanvas(point));
}
