import type { DrawStrokePath } from '../../shared/ui/draw-canvas/draw-canvas.types';
import type { HanziCharacterJson } from './hanzi-character.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import { buildHanziCharacterModel } from './hanzi-character.model';
import { HanziPositioner } from './hanzi-positioner';

/** Set of canonical characters used for golden visual regression tests. */
export const GOLDEN_HANZI_CHARACTERS = ['人', '大', '好', '你', '水'] as const;

/** Union type of all golden test characters. */
export type GoldenHanziCharacter = (typeof GOLDEN_HANZI_CHARACTERS)[number];

/** Default canvas dimensions for golden tests. */
export const GOLDEN_CANVAS_SIZE = { width: 280, height: 280 } as const;

/** Default padding (in px) around the character inside the golden canvas. */
export const GOLDEN_CANVAS_PADDING = 20;

/** Builds a {@link HanziCharacterModel} from raw MMH JSON for a golden test character. */
export function buildGoldenHanziModel(
  character: GoldenHanziCharacter,
  json: HanziCharacterJson,
): HanziCharacterModel {
  return buildHanziCharacterModel(character, json);
}

/** Transforms all strokes of a golden hanzi model into canvas pixel coordinates using the standard positioner. */
export function goldenAlignedStrokes(
  model: HanziCharacterModel,
  canvasSize = GOLDEN_CANVAS_SIZE,
  padding = GOLDEN_CANVAS_PADDING,
): DrawStrokePath[] {
  const positioner = new HanziPositioner({
    width: canvasSize.width,
    height: canvasSize.height,
    padding,
  });
  return model.strokes.map((stroke) => stroke.points.map((point) => positioner.toCanvas(point)));
}

/** Shifts every point in a set of draw strokes by the given `(dx, dy)` offset. */
export function offsetDrawStrokes(
  strokes: readonly DrawStrokePath[],
  dx: number,
  dy: number,
): DrawStrokePath[] {
  return strokes.map((stroke) => stroke.map((point) => ({ x: point.x + dx, y: point.y + dy })));
}

/** Returns a small diagonal scribble path near the top-left corner, used as a placeholder test stroke. */
export function cornerScribbleStroke(): DrawStrokePath {
  return [
    { x: 8, y: 8 },
    { x: 42, y: 38 },
    { x: 18, y: 52 },
  ];
}

/** Fetches the MMH JSON asset for a golden test character from the `/assets/hanzi/` directory. */
export async function fetchGoldenHanziJson(
  character: GoldenHanziCharacter,
): Promise<HanziCharacterJson> {
  const response = await fetch(`/assets/hanzi/${encodeURIComponent(character)}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load golden hanzi JSON for ${character}: ${response.status}`);
  }

  return response.json() as Promise<HanziCharacterJson>;
}
