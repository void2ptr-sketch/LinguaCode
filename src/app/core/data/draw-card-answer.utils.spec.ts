import type { DrawCard } from '../models';
import { checkDrawCardAnswer } from './draw-card-answer.utils';
import { lookupHanStrokeGuides } from './draw-stroke-guides.data';
import type { DrawAnswerPayload } from '../../shared/types/draw-answer.types';

describe('draw-card-answer.utils', () => {
  const canvasSize = { width: 280, height: 280 };
  const renGuides = lookupHanStrokeGuides('人');

  const drawCard: DrawCard = {
    id: 'draw-ren',
    kind: 'draw',
    title: '人',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Нарисуйте',
    referenceHintKnown: 'человек',
    targetCharacter: '人',
    strokeGuides: renGuides,
  };

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

  const alignedPayload: DrawAnswerPayload = {
    canvasMode: 'memory',
    canvasSize,
    strokesByCharacter: [renGuides.map((guide) => guideStroke(guide.path))],
  };

  it('should validate memory mode by stroke count and deviation using proficiency', () => {
    expect(checkDrawCardAnswer(drawCard, true, alignedPayload, 'beginner')).toBeTrue();
    expect(checkDrawCardAnswer(drawCard, true, alignedPayload, 'professional')).toBeTrue();
  });

  it('should accept any non-empty drawing in non-memory modes', () => {
    expect(
      checkDrawCardAnswer(
        drawCard,
        true,
        {
          ...alignedPayload,
          canvasMode: 'tracing',
          strokesByCharacter: [[[{ x: 10, y: 10 }, { x: 20, y: 20 }]]],
        },
        'professional',
      ),
    ).toBeTrue();
  });

  it('should reject memory mode with wrong stroke count for intermediate level', () => {
    expect(
      checkDrawCardAnswer(
        drawCard,
        true,
        {
          ...alignedPayload,
          strokesByCharacter: [[guideStroke(renGuides[0].path)]],
        },
        'intermediate',
      ),
    ).toBeFalse();
  });
});
