import type { HanziCharacterJson } from './hanzi-character.types';
import { buildHanziCharacterModel } from './hanzi-character.model';
import { HanziPositioner } from './hanzi-positioner';
import {
  gradeHanziMemoryStrokes,
  resolveHanziMemoryStrokeCountTolerance,
  validateHanziMemoryStrokes,
} from './hanzi-memory-validation.utils';

const REN_JSON: HanziCharacterJson = {
  strokes: [
    'M 475 485 Q 547 653 563 683 Q 573 695 565 708 Q 558 721 519 742 Q 491 757 480 754 Q 462 750 465 730 Q 484 537 292 308 Q 280 296 269 284 Q 212 217 68 102 Q 58 92 66 89 Q 76 86 90 92 Q 190 138 274 210 Q 380 294 462 456 L 475 485 Z',
    'M 462 456 Q 480 423 575 292 Q 666 171 733 101 Q 764 67 793 69 Q 881 75 958 79 Q 991 80 992 89 Q 993 98 956 112 Q 772 178 740 205 Q 617 304 490 466 Q 481 476 475 485 C 457 509 447 482 462 456 Z',
  ],
  medians: [
    [
      { x: 483, y: 736 },
      { x: 508, y: 702 },
      { x: 511, y: 678 },
      { x: 473, y: 552 },
      { x: 408, y: 416 },
      { x: 328, y: 303 },
      { x: 271, y: 244 },
      { x: 144, y: 139 },
      { x: 72, y: 95 },
    ],
    [
      { x: 474, y: 477 },
      { x: 477, y: 459 },
      { x: 490, y: 439 },
      { x: 571, y: 333 },
      { x: 691, y: 200 },
      { x: 753, y: 145 },
      { x: 798, y: 119 },
      { x: 986, y: 90 },
    ],
  ],
};

describe('hanzi-memory-validation.utils', () => {
  const canvasSize = { width: 280, height: 280 };

  function alignedRenStrokes() {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const positioner = new HanziPositioner({ width: canvasSize.width, height: canvasSize.height, padding: 20 });
    return model.strokes.map((stroke) => stroke.points.map((point) => positioner.toCanvas(point)));
  }

  it('should accept aligned strokes for beginner and professional levels', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const strokes = alignedRenStrokes();

    expect(validateHanziMemoryStrokes(model, canvasSize, strokes, 'beginner').passed).toBeTrue();
    expect(validateHanziMemoryStrokes(model, canvasSize, strokes, 'professional').passed).toBeTrue();
  });

  it('should reject wrong stroke count for intermediate level', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const strokes = alignedRenStrokes().slice(0, 1);

    const result = validateHanziMemoryStrokes(model, canvasSize, strokes, 'intermediate');
    expect(result.passed).toBeFalse();
    expect(result.actualStrokeCount).toBe(1);
    expect(result.expectedStrokeCount).toBe(2);
  });

  it('should expose stroke count tolerance by proficiency', () => {
    expect(resolveHanziMemoryStrokeCountTolerance('beginner')).toBe(1);
    expect(resolveHanziMemoryStrokeCountTolerance('professional')).toBe(0);
  });

  it('should grade each user stroke for memory review', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const strokes = alignedRenStrokes();
    const grades = gradeHanziMemoryStrokes(model, canvasSize, strokes, 'beginner');

    expect(grades).toEqual(['correct', 'correct']);
  });

  it('should mark misaligned strokes as incorrect in memory review', () => {
    const model = buildHanziCharacterModel('人', REN_JSON);
    const strokes = alignedRenStrokes();
    const reversed = [strokes[1]!, strokes[0]!];
    const grades = gradeHanziMemoryStrokes(model, canvasSize, reversed, 'professional');

    expect(grades[0]).toBe('incorrect');
  });
});
