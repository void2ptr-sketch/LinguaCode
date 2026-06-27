import { buildHanziCharacterModel } from './hanzi-character.model';
import { prepareHanziTracingSamples } from './hanzi-tracing-animation.utils';
import { resolveHanziHintStrokeFrame } from './hanzi-hint-animation.utils';

const REN_JSON = {
  strokes: ['M 0 0 Z', 'M 0 0 Z'],
  medians: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: 200 },
    ],
    [
      { x: 100, y: 0 },
      { x: 200, y: 100 },
    ],
  ],
};

describe('hanzi-hint-animation.utils', () => {
  it('should show brush placement circle before direction animation', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    const placement = resolveHanziHintStrokeFrame(200, sample, {
      brushPlacementMs: 700,
      strokeDurationMs: 1000,
      loopPauseMs: 450,
    });

    expect(placement.phase).toBe('brush-placement');
    expect(placement.showStartCircle).toBeTrue();
    expect(placement.progress).toBe(0);
    expect(placement.tip?.point).toEqual({ x: 0, y: 0 });
  });

  it('should animate direction after brush placement phase', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    const direction = resolveHanziHintStrokeFrame(1200, sample, {
      brushPlacementMs: 700,
      strokeDurationMs: 1000,
      loopPauseMs: 450,
    });

    expect(direction.phase).toBe('direction');
    expect(direction.showStartCircle).toBeFalse();
    expect(direction.progress).toBeCloseTo(0.5, 1);
    expect(direction.tip).not.toBeNull();
  });
});
