import { buildHanziCharacterModel } from '../../model/hanzi-character.model';
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
    expect(placement.showStartCircle).toBe(true);
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
    expect(direction.showStartCircle).toBe(false);
    expect(direction.progress).toBeCloseTo(0.5, 1);
    expect(direction.tip).not.toBeNull();
  });

  it('should show loop pause phase after stroke completes', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    const pause = resolveHanziHintStrokeFrame(2300, sample, {
      brushPlacementMs: 700,
      strokeDurationMs: 1000,
      loopPauseMs: 450,
    });

    expect(pause.phase).toBe('brush-placement');
    expect(pause.showStartCircle).toBe(true);
    expect(pause.progress).toBe(0);
  });

  it('should return empty frame for empty densified points', () => {
    const emptySample = prepareHanziTracingSamples([[]])[0]!;

    const frame = resolveHanziHintStrokeFrame(0, emptySample);

    expect(frame.phase).toBe('brush-placement');
    expect(frame.progress).toBe(0);
    expect(frame.showStartCircle).toBe(false);
    expect(frame.tip).toBeNull();
  });

  it('should use custom options when provided', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    const direction = resolveHanziHintStrokeFrame(300, sample, {
      brushPlacementMs: 200,
      strokeDurationMs: 500,
      loopPauseMs: 200,
    });

    expect(direction.phase).toBe('direction');
    expect(direction.progress).toBeCloseTo(0.2, 1);
  });

  it('should use default options when options not provided', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    const placement = resolveHanziHintStrokeFrame(100, sample);

    expect(placement.phase).toBe('brush-placement');
    expect(placement.showStartCircle).toBe(true);
  });

  it('should loop animation cycle correctly', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const sample = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points))[0]!;

    // After one full cycle (700 + 1000 + 450 = 2150), should start over
    const nextCycle = resolveHanziHintStrokeFrame(2200, sample, {
      brushPlacementMs: 700,
      strokeDurationMs: 1000,
      loopPauseMs: 450,
    });

    expect(nextCycle.phase).toBe('brush-placement');
    expect(nextCycle.showStartCircle).toBe(true);
  });
});
