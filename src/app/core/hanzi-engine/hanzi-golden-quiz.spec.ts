import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import type { HanziCharacterModel } from './hanzi-character.model';
import {
  GOLDEN_CANVAS_SIZE,
  GOLDEN_HANZI_CHARACTERS,
  buildGoldenHanziModel,
  cornerScribbleStroke,
  fetchGoldenHanziJson,
  goldenAlignedStrokes,
  offsetDrawStrokes,
  type GoldenHanziCharacter,
} from './hanzi-golden-test.utils';
import { validateHanziMemoryStrokes } from './hanzi-memory-validation.utils';
import { HanziQuizSession } from './hanzi-quiz-session';
import { HanziPositioner } from './hanzi-positioner';

/** Калибровка leniency: beginner принимает лёгкий drift; professional — средний и выше. */
const LENIENCY_BEGINNER_DRIFT_PX = 10;
const LENIENCY_PROFESSIONAL_REJECT_DRIFT_PX = 45;

describe('hanzi golden quiz fixtures', () => {
  for (const character of GOLDEN_HANZI_CHARACTERS) {
    describe(character, () => {
      let model!: HanziCharacterModel;

      beforeAll(async () => {
        const json = await fetchGoldenHanziJson(character);
        model = buildGoldenHanziModel(character, json);
      });

      it('should accept aligned strokes at beginner and professional levels', () => {
        const strokes = goldenAlignedStrokes(model);

        expect(
          validateHanziMemoryStrokes(model, GOLDEN_CANVAS_SIZE, strokes, 'beginner').passed,
        ).toBeTrue();
        expect(
          validateHanziMemoryStrokes(model, GOLDEN_CANVAS_SIZE, strokes, 'professional').passed,
        ).toBeTrue();
      });

      it('should reject a corner scribble', () => {
        const scribble = Array.from({ length: model.strokes.length }, () => cornerScribbleStroke());
        expect(
          validateHanziMemoryStrokes(model, GOLDEN_CANVAS_SIZE, scribble, 'beginner').passed,
        ).toBeFalse();
      });

      it('should reject heavily offset strokes at professional level', () => {
        const offset = offsetDrawStrokes(goldenAlignedStrokes(model), 80, 80);
        expect(
          validateHanziMemoryStrokes(model, GOLDEN_CANVAS_SIZE, offset, 'professional').passed,
        ).toBeFalse();
      });

      it('should reject incomplete stroke order at intermediate level', () => {
        if (model.strokes.length <= 1) {
          return;
        }

        const partial = goldenAlignedStrokes(model).slice(0, 1);
        expect(
          validateHanziMemoryStrokes(model, GOLDEN_CANVAS_SIZE, partial, 'intermediate').passed,
        ).toBeFalse();
      });
    });
  }

  describe('leniency calibration bands', () => {
    const calibrationCharacters: readonly GoldenHanziCharacter[] = ['人', '好'];

    for (const character of calibrationCharacters) {
      it(`should accept small drift for beginner (${character})`, async () => {
        const json = await fetchGoldenHanziJson(character);
        const calibrationModel = buildGoldenHanziModel(character, json);
        const drifted = offsetDrawStrokes(
          goldenAlignedStrokes(calibrationModel),
          LENIENCY_BEGINNER_DRIFT_PX,
          LENIENCY_BEGINNER_DRIFT_PX,
        );

        expect(
          validateHanziMemoryStrokes(calibrationModel, GOLDEN_CANVAS_SIZE, drifted, 'beginner')
            .passed,
        ).toBeTrue();
      });

      it(`should reject medium drift for professional (${character})`, async () => {
        const json = await fetchGoldenHanziJson(character);
        const calibrationModel = buildGoldenHanziModel(character, json);
        const drifted = offsetDrawStrokes(
          goldenAlignedStrokes(calibrationModel),
          LENIENCY_PROFESSIONAL_REJECT_DRIFT_PX,
          LENIENCY_PROFESSIONAL_REJECT_DRIFT_PX,
        );

        expect(
          validateHanziMemoryStrokes(calibrationModel, GOLDEN_CANVAS_SIZE, drifted, 'professional')
            .passed,
        ).toBeFalse();
      });
    }

    const levelExpectations: readonly {
      level: LearningProficiencyLevel;
      leniency: number;
    }[] = [
      { level: 'new-to-language', leniency: 1.35 },
      { level: 'beginner', leniency: 1.2 },
      { level: 'intermediate', leniency: 1 },
      { level: 'professional', leniency: 0.7 },
    ];

    it('should expose quiz leniency multipliers by proficiency level', async () => {
      const json = await fetchGoldenHanziJson('人');
      const calibrationModel = buildGoldenHanziModel('人', json);
      const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
      const alignedFirstStroke = goldenAlignedStrokes(calibrationModel)[0]!;

      for (const { level, leniency } of levelExpectations) {
        const session = new HanziQuizSession(calibrationModel, positioner, {
          proficiencyLevel: level,
        });
        const result = session.submitCanvasStroke(alignedFirstStroke);
        expect(result.accepted).withContext(level).toBeTrue();
        expect(session.summary().strokeCount).withContext(level).toBe(2);
        expect(leniency).withContext(level).toBeGreaterThan(0);
      }
    });
  });
});
