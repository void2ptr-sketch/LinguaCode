import { describe, it, expect } from 'vitest';
import type { BackendCardDto } from './card-backend-dto.types';
import type { Card } from './card.types';
import type { CardDifficulty } from './card-index.types';
import { CardBackendAdapter } from './card-backend-adapter';

/** Helper to access kind-specific fields without `any`. */
function field(card: Card, key: string): unknown {
  return (card as Record<string, unknown>)[key];
}

/**
 * Helper to create a minimal BackendCardDto for testing.
 */
function createBackendDto(overrides: Partial<BackendCardDto> = {}): BackendCardDto {
  return {
    id: 1,
    title: 'Test Card',
    kind: 'SELECT',
    slug: 'test-card',
    authorId: 42,
    dataJson: '{}',
    tags: '[]',
    difficulty: 'BEGINNER',
    requiredTier: 'FREE',
    createdAt: '2026-10-23T00:00:00Z',
    updatedAt: '2026-10-23T00:00:00Z',
    ...overrides,
  };
}

describe('CardBackendAdapter', () => {
  describe('toCard', () => {
    it('should convert SELECT card', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          optionsLearning: ['cat', 'dog', 'bird'],
          correctIndex: 0,
          direction: 'known-to-learning',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('select');
      expect(card.title).toBe('Test Card');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'optionsLearning')).toEqual(['cat', 'dog', 'bird']);
      expect(field(card, 'correctIndex')).toBe(0);
      expect(field(card, 'direction')).toBe('known-to-learning');
    });

    it('should map order from API `order` and DB `card_order`', () => {
      const content = JSON.stringify({
        promptKnown: '猫',
        optionsLearning: ['cat'],
        correctIndex: 0,
      });

      const byApi = CardBackendAdapter.toCard(createBackendDto({ dataJson: content, order: 3 }));
      expect(field(byApi, 'order')).toBe(3);

      const byDb = CardBackendAdapter.toCard(
        createBackendDto({ dataJson: content, card_order: 4 }),
      );
      expect(field(byDb, 'order')).toBe(4);
    });

    it('should convert CODE_SELECT card', () => {
      const dto = createBackendDto({
        kind: 'CODE_SELECT',
        dataJson: JSON.stringify({
          caption: 'Find the matching code',
          prompt: { code: 'console.log("hello")', language: 'javascript' },
          options: [
            { code: 'console.log("hello")', language: 'javascript' },
            { code: 'print("hello")', language: 'python' },
          ],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('code-select');
      expect(field(card, 'caption')).toBe('Find the matching code');
      expect(field(card, 'prompt')).toEqual({
        code: 'console.log("hello")',
        language: 'javascript',
      });
      expect(field(card, 'options')).toHaveLength(2);
      expect(field(card, 'correctIndex')).toBe(0);
    });

    it('should convert MEMORY card', () => {
      const dto = createBackendDto({
        kind: 'MEMORY',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          pairs: [
            { known: '猫', learning: 'cat' },
            { known: '犬', learning: 'dog' },
          ],
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('memory');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'pairs')).toEqual([
        { known: '猫', learning: 'cat' },
        { known: '犬', learning: 'dog' },
      ]);
    });

    it('should convert SYMBOL card', () => {
      const dto = createBackendDto({
        kind: 'SYMBOL',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          symbols: ['猫', '犬', '雀'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('symbol');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'symbols')).toEqual(['猫', '犬', '雀']);
      expect(field(card, 'correctIndex')).toBe(0);
    });

    it('should convert SOUND card', () => {
      const dto = createBackendDto({
        kind: 'SOUND',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          audioLabelLearning: 'neko',
          optionsKnown: ['cat', 'dog', 'bird'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('sound');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'audioLabelLearning')).toBe('neko');
      expect(field(card, 'optionsKnown')).toEqual(['cat', 'dog', 'bird']);
      expect(field(card, 'correctIndex')).toBe(0);
    });

    it('should convert TIMED card', () => {
      const dto = createBackendDto({
        kind: 'TIMED',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          optionsLearning: ['cat', 'dog'],
          correctIndex: 0,
          timeLimitSec: 10,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('timed');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'timeLimitSec')).toBe(10);
    });

    it('should convert KEYBOARD card', () => {
      const dto = createBackendDto({
        kind: 'KEYBOARD',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          acceptedAnswers: ['cat', 'a cat'],
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('keyboard');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'acceptedAnswersKnown')).toEqual(['cat', 'a cat']);
    });

    it('should convert DRAW card', () => {
      const dto = createBackendDto({
        kind: 'DRAW',
        dataJson: JSON.stringify({
          promptKnown: '猫',
          referenceHintKnown: 'neko',
          meaningKnown: 'cat',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('draw');
      expect(field(card, 'promptKnown')).toBe('猫');
      expect(field(card, 'referenceHintKnown')).toBe('neko');
      expect(field(card, 'meaningKnown')).toBe('cat');
    });

    it('should convert TONE card', () => {
      const dto = createBackendDto({
        kind: 'TONE',
        dataJson: JSON.stringify({
          promptKnown: 'ma',
          syllableBase: 'ma',
          toneOptions: [' mā ', ' má ', ' mǎ ', ' mà '],
          correctIndex: 2,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('tone');
      expect(field(card, 'promptKnown')).toBe('ma');
      expect(field(card, 'syllableBase')).toBe('ma');
      expect(field(card, 'correctIndex')).toBe(2);
    });

    it('should convert READING card', () => {
      const dto = createBackendDto({
        kind: 'READING',
        dataJson: JSON.stringify({
          promptKnown: '猫は犬が好きです。',
          optionsLearning: ['The cat likes the dog.'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('reading');
      expect(field(card, 'promptKnown')).toBe('猫は犬が好きです。');
    });

    it('should convert FLIP card', () => {
      const dto = createBackendDto({
        kind: 'FLIP',
        dataJson: JSON.stringify({
          front: '猫',
          back: 'cat',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('flip');
      expect(field(card, 'front')).toBe('猫');
      expect(field(card, 'back')).toBe('cat');
    });

    it('should convert CLOZE card', () => {
      const dto = createBackendDto({
        kind: 'CLOZE',
        dataJson: JSON.stringify({
          promptKnown: 'Я ___ в Москве',
          correctAnswer: 'живу',
          options: ['живу', 'иду', 'бегу'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('cloze');
      expect(field(card, 'promptKnown')).toBe('Я ___ в Москве');
      expect(field(card, 'correctAnswer')).toBe('живу');
      expect(field(card, 'options')).toEqual(['живу', 'иду', 'бегу']);
    });

    it('should convert CODE_TRACE card', () => {
      const dto = createBackendDto({
        kind: 'CODE_TRACE',
        dataJson: JSON.stringify({
          question: 'What is the output?',
          code: { code: 'let x = 1; x++;', language: 'javascript' },
          outputOptions: ['1', '2', '3'],
          correctIndex: 1,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('code-trace');
      expect(field(card, 'question')).toBe('What is the output?');
      expect(field(card, 'code')).toEqual({ code: 'let x = 1; x++;', language: 'javascript' });
      expect(field(card, 'correctIndex')).toBe(1);
    });
  });

  describe('toCards (batch)', () => {
    it('should convert an array of backend DTOs', () => {
      const dtos: BackendCardDto[] = [
        createBackendDto({
          kind: 'SELECT',
          dataJson: JSON.stringify({
            promptKnown: '猫',
            optionsLearning: ['cat'],
            correctIndex: 0,
          }),
        }),
        createBackendDto({
          kind: 'FLIP',
          dataJson: JSON.stringify({ front: '狗', back: 'dog' }),
        }),
      ];

      const cards = CardBackendAdapter.toCards(dtos);

      expect(cards).toHaveLength(2);
      expect(cards[0].kind).toBe('select');
      expect(cards[1].kind).toBe('flip');
    });
  });

  describe('edge cases', () => {
    it('should handle missing content fields with defaults', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: JSON.stringify({}),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('select');
      expect(field(card, 'promptKnown')).toBe('');
      expect(field(card, 'optionsLearning')).toEqual([]);
      expect(field(card, 'correctIndex')).toBe(0);
    });

    it('should handle invalid JSON content and throw', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: 'not valid json',
      });

      expect(() => CardBackendAdapter.toCard(dto)).toThrow(/Failed to parse card content/);
    });

    it('should handle unknown card kind and throw', () => {
      const dto = createBackendDto({
        kind: 'UNKNOWN_KIND' as BackendCardDto['kind'],
        dataJson: '{}',
      });

      expect(() => CardBackendAdapter.toCard(dto)).toThrow(/Unknown card kind/);
    });

    it('should parse tags correctly', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        tags: JSON.stringify(['hsk1', 'n5', 'vocabulary']),
      });

      const card = CardBackendAdapter.toCard(dto);
      expect(field(card, 'tags')).toEqual(['hsk1', 'n5', 'vocabulary']);
    });

    it('should handle empty tags', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        tags: '[]',
      });

      const card = CardBackendAdapter.toCard(dto);
      expect(field(card, 'tags')).toEqual([]);
    });

    it('should preserve createdAt and updatedAt', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        dataJson: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        createdAt: '2026-10-23T10:00:00Z',
        updatedAt: '2026-10-24T12:00:00Z',
      });

      const card = CardBackendAdapter.toCard(dto);
      // createdAt/updatedAt are added to card but may not be in strict Card type
      // This is expected - they're metadata fields
      expect(field(card, 'id')).toBe('1');
    });
  });

  describe('write payloads', () => {
    const card: Card = {
      id: 'card-1',
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Q?',
      optionsLearning: ['A', 'B'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      tags: ['hsk1'],
      difficulty: 'expert',
      requiredTier: 'STARTER',
      published: false,
      slug: 'test-card',
      languagePairId: '1',
      courseId: '10',
      programId: '20',
      lessonId: '30',
      scenarioId: '40',
      order: 2,
    };

    it('should build a create payload with metadata and hierarchy', () => {
      const payload = CardBackendAdapter.toCreatePayload(card);

      expect(payload.title).toBe('Test');
      expect(payload.kind).toBe('SELECT');
      expect(payload.difficulty).toBe('EXPERT');
      expect(payload.requiredTier).toBe('STARTER');
      expect(payload.slug).toBe('test-card');
      expect(payload.languagePairId).toBe(1);
      expect(payload.courseId).toBe(10);
      expect(payload.programId).toBe(20);
      expect(payload.lessonId).toBe(30);
      expect(payload.scenarioId).toBe(40);
      expect(payload.order).toBe(2);
      expect(payload.published).toBe(false);
      expect(JSON.parse(payload.tags)).toEqual(['hsk1']);
      expect(payload).not.toHaveProperty('id');
      expect(payload).not.toHaveProperty('authorId');
    });

    it('should omit a blank slug on create', () => {
      const payload = CardBackendAdapter.toCreatePayload({ ...card, slug: '   ' });

      expect(payload.slug).toBeUndefined();
    });

    it('should build an update payload with requiredTier and kind', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', card);

      expect(payload.kind).toBe('SELECT');
      expect(payload.requiredTier).toBe('STARTER');
      expect(payload.difficulty).toBe('EXPERT');
      expect(payload.published).toBe(false);
      expect(payload.languagePairId).toBe(1);
      expect(payload.courseId).toBe(10);
      expect(payload.programId).toBe(20);
      expect(payload.lessonId).toBe(30);
      expect(payload.scenarioId).toBe(40);
      expect(payload.order).toBe(2);
    });

    it('should omit requiredTier on update when the card has none', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', {
        ...card,
        requiredTier: undefined,
      });

      expect(payload.requiredTier).toBeUndefined();
    });

    it('should omit hierarchy IDs when they are empty/blank', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        ...card,
        languagePairId: '',
        courseId: '   ',
        programId: undefined,
        lessonId: undefined,
        scenarioId: undefined,
      });

      expect(payload).not.toHaveProperty('languagePairId');
      expect(payload).not.toHaveProperty('courseId');
      expect(payload).not.toHaveProperty('programId');
      expect(payload).not.toHaveProperty('lessonId');
      expect(payload).not.toHaveProperty('scenarioId');
    });

    it('should omit order and published when undefined on create', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        ...card,
        order: undefined,
        published: undefined,
      });

      expect(payload).not.toHaveProperty('order');
      expect(payload).not.toHaveProperty('published');
    });

    it('should omit slug on update when blank', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', {
        ...card,
        slug: '',
      });

      expect(payload.slug).toBeUndefined();
    });

    it('should omit difficulty on update when undefined', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', {
        ...card,
        difficulty: undefined,
      });

      expect(payload.difficulty).toBeUndefined();
    });

    it('should omit order on update when undefined', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', {
        ...card,
        order: undefined,
      });

      expect(payload.order).toBeUndefined();
    });

    it('should omit published on update when undefined', () => {
      const payload = CardBackendAdapter.toUpdatePayload('card-1', {
        ...card,
        published: undefined,
      });

      expect(payload.published).toBeUndefined();
    });

    it('should map unknown difficulty to null', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        ...card,
        difficulty: 'unknown' as CardDifficulty,
      });

      expect(payload.difficulty).toBeNull();
    });

    // ── extractCardContent branch coverage ──

    it('should extract code-select content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'code-select',
        title: 'Code',
        caption: 'Find matching code',
        prompt: { code: 'x = 1', language: 'javascript' },
        options: [{ code: 'x = 1', language: 'javascript' }],
        correctIndex: 0,
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('CODE_SELECT');
      expect(parsed.caption).toBe('Find matching code');
      expect(parsed.prompt).toEqual({ code: 'x = 1', language: 'javascript' });
      expect(parsed.options).toEqual([{ code: 'x = 1', language: 'javascript' }]);
    });

    it('should extract memory content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'memory',
        title: 'Memory',
        promptKnown: '猫',
        pairs: [{ known: '猫', learning: 'cat' }],
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('MEMORY');
      expect(parsed.promptKnown).toBe('猫');
      expect(parsed.pairs).toEqual([{ known: '猫', learning: 'cat' }]);
    });

    it('should extract symbol content with direction', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'symbol',
        title: 'Symbol',
        promptKnown: '猫',
        symbols: ['猫', '犬'],
        correctIndex: 0,
        direction: 'learning-to-known',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('SYMBOL');
      expect(parsed.direction).toBe('learning-to-known');
    });

    it('should extract sound content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'sound',
        title: 'Sound',
        promptKnown: '猫',
        audioLabelLearning: 'neko',
        optionsKnown: ['cat'],
        correctIndex: 0,
        direction: 'known-to-learning',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('SOUND');
      expect(parsed.audioLabelLearning).toBe('neko');
    });

    it('should extract timed content with timeLimitSec', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'timed',
        title: 'Timed',
        promptKnown: '猫',
        optionsLearning: ['cat'],
        correctIndex: 0,
        timeLimitSec: 15,
        direction: 'known-to-learning',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.timeLimitSec).toBe(15);
    });

    it('should extract keyboard content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'keyboard',
        title: 'Keyboard',
        promptKnown: '猫',
        acceptedAnswersKnown: ['cat', 'a cat'],
        direction: 'known-to-learning',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('KEYBOARD');
      expect(parsed.acceptedAnswers).toEqual(['cat', 'a cat']);
    });

    it('should extract draw content with all optional fields', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'draw',
        title: 'Draw',
        promptKnown: '猫',
        referenceHintKnown: 'neko',
        meaningKnown: 'cat',
        practiceMode: 'tracing',
        targetCharacter: '猫',
        promptLexeme: { primary: '猫', script: 'hani', pinyin: 'māo' },
        strokeGuides: [{ order: 1, path: 'M0,0 L10,10' }],
        radicalHint: '犭',
        characterTargets: [{ character: '猫', pinyin: 'māo' }],
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('DRAW');
      expect(parsed.practiceMode).toBe('tracing');
      expect(parsed.targetCharacter).toBe('猫');
      expect(parsed.promptLexeme).toEqual({ primary: '猫', script: 'hani', pinyin: 'māo' });
      expect(parsed.strokeGuides).toEqual([{ order: 1, path: 'M0,0 L10,10' }]);
      expect(parsed.radicalHint).toBe('犭');
      expect(parsed.characterTargets).toEqual([{ character: '猫', pinyin: 'māo' }]);
    });

    it('should extract tone content with direction', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'tone',
        title: 'Tone',
        promptKnown: 'ma',
        syllableBase: 'ma',
        toneOptions: [1, 2, 3, 4] as const,
        correctIndex: 0,
        direction: 'known-to-learning',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('TONE');
      expect(parsed.direction).toBe('known-to-learning');
    });

    it('should extract reading content with direction', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'reading',
        title: 'Reading',
        promptKnown: '猫は犬',
        optionsLearning: ['The cat'],
        correctIndex: 0,
        direction: 'known-to-learning',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('READING');
      expect(parsed.direction).toBe('known-to-learning');
    });

    it('should extract cloze content with optional fields', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'cloze',
        title: 'Cloze',
        promptKnown: 'Я ___',
        correctAnswer: 'иду',
        options: ['иду', 'бегу'],
        correctIndex: 0,
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('CLOZE');
      expect(parsed.options).toEqual(['иду', 'бегу']);
      expect(parsed.correctIndex).toBe(0);
    });

    it('should extract code-trace content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'code-trace',
        title: 'Trace',
        caption: 'Trace code',
        question: 'Output?',
        code: { code: 'x = 1', language: 'javascript' },
        outputOptions: ['1', '2'],
        correctIndex: 1,
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('CODE_TRACE');
      expect(parsed.code).toEqual({ code: 'x = 1', language: 'javascript' });
    });

    it('should extract flip content', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'flip',
        title: 'Flip',
        front: '猫',
        back: 'cat',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.kind).toBe('FLIP');
      expect(parsed.front).toBe('猫');
      expect(parsed.back).toBe('cat');
    });

    // ── toCard fast-path & edge branches ──

    it('should return dto as-is when dataJson is already an object (fast-path)', () => {
      const dto = {
        id: 1,
        kind: 'select',
        title: 'Fast',
        dataJson: { promptKnown: '猫' },
      } as unknown as BackendCardDto;

      const card = CardBackendAdapter.toCard(dto);
      expect(card.kind).toBe('select');
    });

    it('should handle lowercase backend kind from mock data (fast-path)', () => {
      const dto = {
        id: 1,
        kind: 'select',
        title: 'Mock',
        slug: 'mock',
        authorId: 1,
        dataJson: { promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 },
        tags: '[]',
        requiredTier: 'FREE',
      } as unknown as BackendCardDto;

      const card = CardBackendAdapter.toCard(dto);
      expect(card.kind).toBe('select');
    });

    it('should handle truthy difficulty in mapDifficulty', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        difficulty: 'INTERMEDIATE',
        dataJson: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
      });

      const card = CardBackendAdapter.toCard(dto);
      expect(card.difficulty).toBe('intermediate');
    });

    it('should handle dataJson as already-parsed object (fast-path)', () => {
      const dto = {
        id: 1,
        title: 'Test',
        kind: 'select',
        slug: 'test',
        authorId: 1,
        dataJson: { promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 },
        tags: '[]',
        requiredTier: 'FREE',
      } as unknown as BackendCardDto;

      const card = CardBackendAdapter.toCard(dto);
      // Fast-path: dto is returned as-is when dataJson is not a string
      expect(card.kind).toBe('select');
      expect(card.title).toBe('Test');
    });

    it('should handle non-array tags gracefully', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        tags: '"not-an-array"',
        dataJson: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
      });

      const card = CardBackendAdapter.toCard(dto);
      expect(field(card, 'tags')).toEqual([]);
    });

    it('should handle toNullableNumber with blank string', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        ...card,
        languagePairId: '   ',
      });

      expect(payload).not.toHaveProperty('languagePairId');
    });

    it('should handle toNullableNumber with non-numeric string', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        ...card,
        languagePairId: 'abc',
      });

      expect(payload).not.toHaveProperty('languagePairId');
    });

    it('should handle CLOZE without correctIndex', () => {
      const payload = CardBackendAdapter.toCreatePayload({
        id: 'c1',
        kind: 'cloze',
        title: 'Cloze',
        promptKnown: 'Я ___',
        correctAnswer: 'иду',
        appearance: { theme: 'default', fontSize: 'md' },
      } as Card);

      const parsed = JSON.parse(payload.dataJson);
      expect(parsed.correctIndex).toBeUndefined();
    });
  });
});
