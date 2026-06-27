import { lookupHanStrokeGuides } from './draw-stroke-guides.data';
import { resolveStrokeAnimationFrame, sampleGuidePath, slicePolylineAtProgress } from './draw-stroke-path.utils';

describe('draw-stroke-path.utils', () => {
  it('should sample guide path including quadratic segments', () => {
    const guides = lookupHanStrokeGuides('大');
    const curved = guides.find((guide) => guide.path.includes('Q'));
    expect(curved).toBeDefined();
    expect(sampleGuidePath(curved!.path, 2).length).toBeGreaterThan(4);
  });

  it('should slice polyline by progress', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
    ];
    const half = slicePolylineAtProgress(points, 0.5);
    expect(half.length).toBeGreaterThan(1);
    expect(half.at(-1)?.x).toBeCloseTo(50, 0);
  });

  it('should advance stroke animation frame over time', () => {
    const guides = lookupHanStrokeGuides('人');
    const samples = guides.map((guide) => sampleGuidePath(guide.path, 1));

    const start = resolveStrokeAnimationFrame(0, guides.length, samples);
    expect(start.completedStrokeCount).toBe(0);
    expect(start.activeProgress).toBe(0);

    const mid = resolveStrokeAnimationFrame(450, guides.length, samples);
    expect(mid.activeStrokeIndex).toBe(0);
    expect(mid.activeProgress).toBeCloseTo(0.5, 1);

    const secondStroke = resolveStrokeAnimationFrame(950, guides.length, samples);
    expect(secondStroke.completedStrokeCount).toBe(1);
  });
});
