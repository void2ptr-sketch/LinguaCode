import { lookupHanStrokeGuides } from './draw-stroke-guides.data';
import {
  resolveDrawStrokeValidationThresholds,
  validateDrawStrokesAgainstGuides,
} from './draw-stroke-validation.utils';

describe('draw-stroke-validation.utils', () => {
  const canvasSize = { width: 280, height: 280 };
  const renGuides = lookupHanStrokeGuides('人');

  function guideStroke(guidePath: string) {
    const tokens = guidePath.trim().split(/\s+/);
    const startX = Number(tokens[1]);
    const startY = Number(tokens[2]);
    const endX = Number(tokens[tokens.length - 2]);
    const endY = Number(tokens[tokens.length - 1]);

    return [
      { x: (startX / 100) * canvasSize.width, y: (startY / 100) * canvasSize.height },
      { x: (endX / 100) * canvasSize.width, y: (endY / 100) * canvasSize.height },
    ];
  }

  it('should pass aligned strokes for beginner thresholds', () => {
    const result = validateDrawStrokesAgainstGuides({
      strokes: renGuides.map((guide) => guideStroke(guide.path)),
      guides: renGuides,
      canvasSize,
      thresholds: resolveDrawStrokeValidationThresholds('beginner'),
    });

    expect(result.passed).toBeTrue();
    expect(result.actualStrokeCount).toBe(2);
    expect(result.meanDeviation).not.toBeNull();
    expect(result.meanDeviation!).toBeLessThan(2);
  });

  it('should fail when stroke count differs beyond tolerance', () => {
    const result = validateDrawStrokesAgainstGuides({
      strokes: [guideStroke(renGuides[0].path)],
      guides: renGuides,
      canvasSize,
      thresholds: resolveDrawStrokeValidationThresholds('intermediate'),
    });

    expect(result.passed).toBeFalse();
    expect(result.actualStrokeCount).toBe(1);
    expect(result.expectedStrokeCount).toBe(2);
  });

  it('should fail when deviation is too large for professional level', () => {
    const result = validateDrawStrokesAgainstGuides({
      strokes: [
        [
          { x: 10, y: 10 },
          { x: 40, y: 40 },
        ],
        [
          { x: 200, y: 200 },
          { x: 240, y: 240 },
        ],
      ],
      guides: renGuides,
      canvasSize,
      thresholds: resolveDrawStrokeValidationThresholds('professional'),
    });

    expect(result.passed).toBeFalse();
    expect(result.meanDeviation).not.toBeNull();
    expect(result.meanDeviation!).toBeGreaterThan(4);
  });
});
