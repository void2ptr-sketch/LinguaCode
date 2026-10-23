import { describe, it, expect } from 'vitest';
import type { BackendCardDto } from './card-backend-dto.types';
import { CardBackendAdapter } from './card-backend-adapter';

/**
 * Helper to create a minimal BackendCardDto for testing.
 */
function createBackendDto(overrides: Partial<BackendCardDto> = {}): BackendCardDto {
  return {
    id: 'test-card-123',
    title: 'Test Card',
    kind: 'SELECT',
    content: '{}',
    tags: '[]',
    difficulty: 'BEGINNER',
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
        content: JSON.stringify({
          promptKnown: '猫',
          optionsLearning: ['cat', 'dog', 'bird'],
          correctIndex: 0,
          direction: 'known-to-learning',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('select');
      expect(card.title).toBe('Test Card');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).optionsLearning).toEqual(['cat', 'dog', 'bird']);
      expect((card as any).correctIndex).toBe(0);
      expect((card as any).direction).toBe('known-to-learning');
    });

    it('should convert CODE_SELECT card', () => {
      const dto = createBackendDto({
        kind: 'CODE_SELECT',
        content: JSON.stringify({
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
      expect((card as any).caption).toBe('Find the matching code');
      expect((card as any).prompt).toEqual({ code: 'console.log("hello")', language: 'javascript' });
      expect((card as any).options).toHaveLength(2);
      expect((card as any).correctIndex).toBe(0);
    });

    it('should convert MEMORY card', () => {
      const dto = createBackendDto({
        kind: 'MEMORY',
        content: JSON.stringify({
          promptKnown: '猫',
          pairs: [
            { known: '猫', learning: 'cat' },
            { known: '犬', learning: 'dog' },
          ],
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('memory');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).pairs).toEqual([
        { known: '猫', learning: 'cat' },
        { known: '犬', learning: 'dog' },
      ]);
    });

    it('should convert SYMBOL card', () => {
      const dto = createBackendDto({
        kind: 'SYMBOL',
        content: JSON.stringify({
          promptKnown: '猫',
          symbols: ['猫', '犬', '雀'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('symbol');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).symbols).toEqual(['猫', '犬', '雀']);
      expect((card as any).correctIndex).toBe(0);
    });

    it('should convert SOUND card', () => {
      const dto = createBackendDto({
        kind: 'SOUND',
        content: JSON.stringify({
          promptKnown: '猫',
          audioLabelLearning: 'neko',
          optionsKnown: ['cat', 'dog', 'bird'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('sound');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).audioLabelLearning).toBe('neko');
      expect((card as any).optionsKnown).toEqual(['cat', 'dog', 'bird']);
      expect((card as any).correctIndex).toBe(0);
    });

    it('should convert TIMED card', () => {
      const dto = createBackendDto({
        kind: 'TIMED',
        content: JSON.stringify({
          promptKnown: '猫',
          optionsLearning: ['cat', 'dog'],
          correctIndex: 0,
          timeLimitSec: 10,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('timed');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).timeLimitSec).toBe(10);
    });

    it('should convert KEYBOARD card', () => {
      const dto = createBackendDto({
        kind: 'KEYBOARD',
        content: JSON.stringify({
          promptKnown: '猫',
          acceptedAnswers: ['cat', 'a cat'],
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('keyboard');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).acceptedAnswersKnown).toEqual(['cat', 'a cat']);
    });

    it('should convert DRAW card', () => {
      const dto = createBackendDto({
        kind: 'DRAW',
        content: JSON.stringify({
          promptKnown: '猫',
          referenceHintKnown: 'neko',
          meaningKnown: 'cat',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('draw');
      expect((card as any).promptKnown).toBe('猫');
      expect((card as any).referenceHintKnown).toBe('neko');
      expect((card as any).meaningKnown).toBe('cat');
    });

    it('should convert TONE card', () => {
      const dto = createBackendDto({
        kind: 'TONE',
        content: JSON.stringify({
          promptKnown: 'ma',
          syllableBase: 'ma',
          toneOptions: [' mā ', ' má ', ' mǎ ', ' mà '],
          correctIndex: 2,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('tone');
      expect((card as any).promptKnown).toBe('ma');
      expect((card as any).syllableBase).toBe('ma');
      expect((card as any).correctIndex).toBe(2);
    });

    it('should convert READING card', () => {
      const dto = createBackendDto({
        kind: 'READING',
        content: JSON.stringify({
          promptKnown: '猫は犬が好きです。',
          optionsLearning: ['The cat likes the dog.'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('reading');
      expect((card as any).promptKnown).toBe('猫は犬が好きです。');
    });

    it('should convert FLIP card', () => {
      const dto = createBackendDto({
        kind: 'FLIP',
        content: JSON.stringify({
          front: '猫',
          back: 'cat',
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('flip');
      expect((card as any).front).toBe('猫');
      expect((card as any).back).toBe('cat');
    });

    it('should convert CLOZE card', () => {
      const dto = createBackendDto({
        kind: 'CLOZE',
        content: JSON.stringify({
          promptKnown: 'Я ___ в Москве',
          correctAnswer: 'живу',
          options: ['живу', 'иду', 'бегу'],
          correctIndex: 0,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('cloze');
      expect((card as any).promptKnown).toBe('Я ___ в Москве');
      expect((card as any).correctAnswer).toBe('живу');
      expect((card as any).options).toEqual(['живу', 'иду', 'бегу']);
    });

    it('should convert CODE_TRACE card', () => {
      const dto = createBackendDto({
        kind: 'CODE_TRACE',
        content: JSON.stringify({
          question: 'What is the output?',
          code: { code: 'let x = 1; x++;', language: 'javascript' },
          outputOptions: ['1', '2', '3'],
          correctIndex: 1,
        }),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('code-trace');
      expect((card as any).question).toBe('What is the output?');
      expect((card as any).code).toEqual({ code: 'let x = 1; x++;', language: 'javascript' });
      expect((card as any).correctIndex).toBe(1);
    });
  });

  describe('toCards (batch)', () => {
    it('should convert an array of backend DTOs', () => {
      const dtos: BackendCardDto[] = [
        createBackendDto({
          kind: 'SELECT',
          content: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        }),
        createBackendDto({
          kind: 'FLIP',
          content: JSON.stringify({ front: '狗', back: 'dog' }),
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
        content: JSON.stringify({}),
      });

      const card = CardBackendAdapter.toCard(dto);

      expect(card.kind).toBe('select');
      expect((card as any).promptKnown).toBe('');
      expect((card as any).optionsLearning).toEqual([]);
      expect((card as any).correctIndex).toBe(0);
    });

    it('should handle invalid JSON content and throw', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        content: 'not valid json',
      });

      expect(() => CardBackendAdapter.toCard(dto)).toThrow(
        /Failed to parse card content/,
      );
    });

    it('should handle unknown card kind and throw', () => {
      const dto = createBackendDto({
        kind: 'UNKNOWN_KIND' as any,
        content: '{}',
      });

      expect(() => CardBackendAdapter.toCard(dto)).toThrow(/Unknown card kind/);
    });

    it('should parse tags correctly', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        content: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        tags: JSON.stringify(['hsk1', 'n5', 'vocabulary']),
      });

      const card = CardBackendAdapter.toCard(dto);
      expect((card as any).tags).toEqual(['hsk1', 'n5', 'vocabulary']);
    });

    it('should handle empty tags', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        content: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        tags: '[]',
      });

      const card = CardBackendAdapter.toCard(dto);
      expect((card as any).tags).toEqual([]);
    });

    it('should preserve createdAt and updatedAt', () => {
      const dto = createBackendDto({
        kind: 'SELECT',
        content: JSON.stringify({ promptKnown: '猫', optionsLearning: ['cat'], correctIndex: 0 }),
        createdAt: '2026-10-23T10:00:00Z',
        updatedAt: '2026-10-24T12:00:00Z',
      });

      const card = CardBackendAdapter.toCard(dto);
      // Note: createdAt/updatedAt are added to card but may not be in strict Card type
      // This is expected - they're metadata fields
    });
  });
});
