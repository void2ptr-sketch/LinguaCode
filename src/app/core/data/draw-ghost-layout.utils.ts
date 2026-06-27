import type { ViewBoxPoint } from './draw-stroke-path.utils';

export type GhostGuideTransform = {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
};

export type GhostInkMeasureInput = {
  character: string;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
};

/** Сопоставляет viewBox 0–100 с em-квадратом (fallback, если нет метрик). */
export function resolveGhostGuideTransform(
  width: number,
  height: number,
  fontSize: number,
): GhostGuideTransform {
  const boxWidth = fontSize;
  const boxHeight = fontSize;

  return {
    offsetX: (width - boxWidth) / 2,
    offsetY: (height - boxHeight) / 2,
    scaleX: boxWidth / 100,
    scaleY: boxHeight / 100,
  };
}

/** Сопоставляет viewBox 0–100 с квадратом вокруг «чернил» иероглифа на canvas. */
export function resolveGhostInkTransform(
  context: CanvasRenderingContext2D,
  input: GhostInkMeasureInput,
): GhostGuideTransform {
  const { character, width, height, fontSize, fontFamily } = input;
  if (!character) {
    return resolveGhostGuideTransform(width, height, fontSize);
  }

  context.save();
  context.font = `${fontSize}px ${fontFamily}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const metrics = context.measureText(character);
  const anchorX = width / 2;
  const anchorY = height / 2;

  const fontAscent = metrics.fontBoundingBoxAscent > 0 ? metrics.fontBoundingBoxAscent : fontSize * 0.88;
  const fontDescent = metrics.fontBoundingBoxDescent > 0 ? metrics.fontBoundingBoxDescent : fontSize * 0.12;
  const baselineY = anchorY - (fontDescent - fontAscent) / 2;

  const inkLeft = anchorX - metrics.actualBoundingBoxLeft;
  const inkTop = baselineY - metrics.actualBoundingBoxAscent;
  const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  context.restore();

  if (inkWidth <= 0 || inkHeight <= 0) {
    return resolveGhostGuideTransform(width, height, fontSize);
  }

  const inkCenterX = inkLeft + inkWidth / 2;
  const inkCenterY = inkTop + inkHeight / 2;
  const squareSize = Math.max(inkWidth, inkHeight, fontSize * 0.72);

  return {
    offsetX: inkCenterX - squareSize / 2,
    offsetY: inkCenterY - squareSize / 2,
    scaleX: squareSize / 100,
    scaleY: squareSize / 100,
  };
}

export function mapViewBoxPoint(
  point: ViewBoxPoint,
  transform: GhostGuideTransform,
): { x: number; y: number } {
  return {
    x: transform.offsetX + point.x * transform.scaleX,
    y: transform.offsetY + point.y * transform.scaleY,
  };
}

/** Transform для SVG-группы в user units viewBox 0–100. */
export function resolveSvgGuideGroupTransform(
  width: number,
  height: number,
  guideTransform: GhostGuideTransform,
): string {
  const tx = (guideTransform.offsetX * 100) / Math.max(width, 1);
  const ty = (guideTransform.offsetY * 100) / Math.max(height, 1);
  const sx = (guideTransform.scaleX * 100) / Math.max(width, 1);
  const sy = (guideTransform.scaleY * 100) / Math.max(height, 1);

  return `translate(${tx} ${ty}) scale(${sx} ${sy})`;
}

export function resolveGhostFontSize(width: number): number {
  return Math.floor(width * 0.72);
}
