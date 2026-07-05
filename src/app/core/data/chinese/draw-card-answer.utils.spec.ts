import type { DrawCard } from '../../models';
import type { HanziCharacterJson } from '../../hanzi-engine/hanzi-character.types';
import { buildHanziCharacterModel } from '../../hanzi-engine/hanzi-character.model';
import { HanziPositioner } from '../../hanzi-engine/hanzi-positioner';
import { checkDrawCardAnswer } from './draw-card-answer.utils';
import type { DrawAnswerPayload } from '../../../shared/types/draw-answer.types';

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

describe('draw-card-answer.utils', () => {
  const canvasSize = { width: 280, height: 280 };
  const renModel = buildHanziCharacterModel('人', REN_JSON);

  const drawCard: DrawCard = {
    id: 'draw-ren',
    kind: 'draw',
    title: '人',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Нарисуйте',
    referenceHintKnown: 'человек',
    targetCharacter: '人',
  };

  function alignedRenPayload(): DrawAnswerPayload {
    const positioner = new HanziPositioner({
      width: canvasSize.width,
      height: canvasSize.height,
      padding: 20,
    });
    const strokes = renModel.strokes.map((stroke) =>
      stroke.points.map((point) => positioner.toCanvas(point)),
    );

    return {
      canvasMode: 'memory',
      canvasSize,
      strokesByCharacter: [strokes],
    };
  }

  const getHanziModel = (character: string) => (character === '人' ? renModel : null);

  it('should validate memory mode by hanzi-engine grading with proficiency', () => {
    const payload = alignedRenPayload();
    expect(checkDrawCardAnswer(drawCard, true, payload, 'beginner', getHanziModel)).toBeTrue();
    expect(checkDrawCardAnswer(drawCard, true, payload, 'professional', getHanziModel)).toBeTrue();
  });

  it('should accept any non-empty drawing in non-memory modes', () => {
    expect(
      checkDrawCardAnswer(
        drawCard,
        true,
        {
          ...alignedRenPayload(),
          canvasMode: 'tracing',
          strokesByCharacter: [
            [
              [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
              ],
            ],
          ],
        },
        'professional',
        getHanziModel,
      ),
    ).toBeTrue();
  });

  it('should reject memory mode with wrong stroke count for intermediate level', () => {
    const payload = alignedRenPayload();
    expect(
      checkDrawCardAnswer(
        drawCard,
        true,
        {
          ...payload,
          strokesByCharacter: [payload.strokesByCharacter[0]!.slice(0, 1)],
        },
        'intermediate',
        getHanziModel,
      ),
    ).toBeFalse();
  });

  it('should reject memory mode when hanzi model is unavailable', () => {
    expect(checkDrawCardAnswer(drawCard, true, alignedRenPayload(), 'beginner')).toBeFalse();
  });
});
