import { HanziPositioner } from './hanzi-positioner';
import { resolveHanziSvgGroupTransform } from './hanzi-render.utils';

export type HanziRadicalLayoutSize = {
  readonly width: number;
  readonly height: number;
};

/** SVG transform для компонента радикала в горизонтальной ячейке (как ghost-слой). */
export function resolveRadicalComponentSvgTransform(
  componentIndex: number,
  componentCount: number,
  canvasSize: HanziRadicalLayoutSize,
  padding = 20,
): string {
  const count = Math.max(componentCount, 1);
  const safeIndex = Math.min(Math.max(componentIndex, 0), count - 1);
  const cellWidth = canvasSize.width / count;
  const positioner = new HanziPositioner({
    width: cellWidth,
    height: canvasSize.height,
    padding,
  });
  const innerTransform = resolveHanziSvgGroupTransform(positioner);
  const offsetX = safeIndex * cellWidth;

  return `translate(${offsetX} 0) ${innerTransform}`;
}

/** Центр ячейки для canvas-fallback (Noto), когда JSON черт недоступен. */
export function resolveRadicalComponentCellCenter(
  componentIndex: number,
  componentCount: number,
  canvasSize: HanziRadicalLayoutSize,
): { x: number; y: number } {
  const count = Math.max(componentCount, 1);
  const safeIndex = Math.min(Math.max(componentIndex, 0), count - 1);
  const cellWidth = canvasSize.width / count;

  return {
    x: safeIndex * cellWidth + cellWidth / 2,
    y: canvasSize.height / 2,
  };
}
