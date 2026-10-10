import { buildHanziCharacterModel } from './hanzi-character.model';
import {
  prepareHanziTracingSamples,
  resolveHanziTracingFrame,
  sliceHanziPolylineByProgress,
  tracingRevealProgress,
} from './hanzi-tracing-animation.utils';

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

describe('hanzi-tracing-animation.utils', () => {
  it('should slice polyline by arc-length progress', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const half = sliceHanziPolylineByProgress(points, 0.5);
    expect(half.at(-1)?.x).toBeCloseTo(50, 0);
  });

  it('should pause between strokes', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const samples = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points));

    const duringDelay = resolveHanziTracingFrame(950, samples, {
      strokeDurationMs: 900,
      delayBetweenStrokesMs: 400,
      loopPauseMs: 800,
    });

    expect(duringDelay.completedStrokeCount).toBe(1);
    expect(duringDelay.activeProgress).toBe(0);
  });

  it('should expose reveal progress per stroke', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const samples = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points));
    const frame = resolveHanziTracingFrame(450, samples, {
      strokeDurationMs: 900,
      delayBetweenStrokesMs: 400,
      loopPauseMs: 800,
    });

    expect(tracingRevealProgress(frame, 0)).toBeCloseTo(0.5, 1);
    expect(tracingRevealProgress(frame, 1)).toBe(0);
  });
});
