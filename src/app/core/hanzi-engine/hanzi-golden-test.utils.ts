import type { DrawStrokePath } from '../../shared/components/draw-canvas/draw-canvas.types';
import type { HanziCharacterJson } from './hanzi-character.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import { buildHanziCharacterModel } from './hanzi-character.model';
import { HanziPositioner } from './hanzi-positioner';

export const GOLDEN_HANZI_CHARACTERS = ['人', '大', '好', '你', '水'] as const;

export type GoldenHanziCharacter = (typeof GOLDEN_HANZI_CHARACTERS)[number];

export const GOLDEN_CANVAS_SIZE = { width: 280, height: 280 } as const;

export const GOLDEN_CANVAS_PADDING = 20;

export function buildGoldenHanziModel(
  character: GoldenHanziCharacter,
  json: HanziCharacterJson,
): HanziCharacterModel {
  return buildHanziCharacterModel(character, json);
}

export function goldenAlignedStrokes(
  model: HanziCharacterModel,
  canvasSize = GOLDEN_CANVAS_SIZE,
  padding = GOLDEN_CANVAS_PADDING,
): DrawStrokePath[] {
  const positioner = new HanziPositioner({ width: canvasSize.width, height: canvasSize.height, padding });
  return model.strokes.map((stroke) => stroke.points.map((point) => positioner.toCanvas(point)));
}

export function offsetDrawStrokes(
  strokes: readonly DrawStrokePath[],
  dx: number,
  dy: number,
): DrawStrokePath[] {
  return strokes.map((stroke) => stroke.map((point) => ({ x: point.x + dx, y: point.y + dy })));
}

export function cornerScribbleStroke(): DrawStrokePath {
  return [
    { x: 8, y: 8 },
    { x: 42, y: 38 },
    { x: 18, y: 52 },
  ];
}

export async function fetchGoldenHanziJson(character: GoldenHanziCharacter): Promise<HanziCharacterJson> {
  const response = await fetch(`/assets/hanzi/${encodeURIComponent(character)}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load golden hanzi JSON for ${character}: ${response.status}`);
  }

  return response.json() as Promise<HanziCharacterJson>;
}
