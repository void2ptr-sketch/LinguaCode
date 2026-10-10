import { HanziPositioner } from '../positioning/hanzi-positioner';
import { resolveHanziSvgGroupTransform } from './hanzi-render.utils';

/**
 * Dimensions of a single radical component cell.
 */
export type HanziRadicalLayoutSize = {
  readonly width: number;
  readonly height: number;
};

/**
 * Generates an SVG transform string for a radical component in a horizontal cell layout.
 *
 * @param componentIndex - Zero-based index of the component.
 * @param componentCount - Total number of components in the row.
 * @param canvasSize - The overall canvas dimensions.
 * @param padding - Padding in pixels around each component. Defaults to `20`.
 * @returns An SVG `transform` string combining cell offset and inner scaling.
 */
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

/**
 * Returns the center point of a radical component cell for canvas fallback
 * (Noto font) when stroke JSON is unavailable.
 *
 * @param componentIndex - Zero-based index of the component.
 * @param componentCount - Total number of components in the row.
 * @param canvasSize - The overall canvas dimensions.
 * @returns The center `{x, y}` coordinates within the cell.
 */
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
