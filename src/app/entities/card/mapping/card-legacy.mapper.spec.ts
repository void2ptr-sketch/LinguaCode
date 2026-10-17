import { normalizeLegacyCard, normalizeLegacyCards } from './card-legacy.mapper';
import type {
  Card,
  SelectCard,
  MemoryCard,
  SymbolCard,
  SoundCard,
  TimedCard,
  KeyboardCard,
  DrawCard,
} from '../model';

describe('card-legacy.mapper', () => {
  describe('normalizeLegacyCard', () => {
    describe('select card', () => {
      it('should pass through a valid modern select card', () => {
        const card: SelectCard = {
          id: 'c1',
          kind: 'select',
          title: 'Select',
          appearance: { theme: 'default', fontSize: 'md' },
          promptKnown: 'Hello',
          optionsLearning: ['A', 'B'],
          direction: 'known-to-learning',
          correctIndex: 0,
        };
        const result = normalizeLegacyCard(card);
        expect(result).toBe(card);
        expect((result as SelectCard).direction).toBe('known-to-learning');
      });

      it('should fill missing promptKnown and optionsLearning for legacy select', () => {
        const legacy = {
          id: 'c1',
          kind: 'select',
          title: 'Legacy Select',
          question: 'What is this?',
          options: ['Option A', 'Option B'],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect(result.kind).toBe('select');
        expect((result as SelectCard).promptKnown).toBe('What is this?');
        expect((result as SelectCard).optionsLearning).toEqual(['Option A', 'Option B']);
        expect((result as SelectCard).direction).toBe('known-to-learning');
      });

      it('should preserve existing promptKnown and optionsLearning', () => {
        const card = {
          id: 'c1',
          kind: 'select',
          title: 'Card',
          promptKnown: 'Existing prompt',
          optionsLearning: ['Opt1'],
        } as unknown as Card;

        const result = normalizeLegacyCard(card);
        expect((result as SelectCard).promptKnown).toBe('Existing prompt');
        expect((result as SelectCard).optionsLearning).toEqual(['Opt1']);
      });
    });

    describe('multiple-choice card', () => {
      it('should normalize legacy multiple-choice to select card', () => {
        const legacy = {
          id: 'c1',
          kind: 'multiple-choice',
          title: 'Q1',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          caption: 'Вопрос по теме',
          options: [
            { id: 'a', text: 'Правильный ответ' },
            { id: 'b', text: 'Неправильный 1' },
            { id: 'c', text: 'Неправильный 2' },
          ],
          correctOptionId: 'a',
          languagePair: { known: 'ru', learning: 'cpp' },
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect(result.kind).toBe('select');
        const select = result as SelectCard;
        expect(select.promptKnown).toBe('Вопрос по теме');
        expect(select.optionsLearning).toEqual([
          'Правильный ответ',
          'Неправильный 1',
          'Неправильный 2',
        ]);
        expect(select.correctIndex).toBe(0);
        expect(select.direction).toBe('known-to-learning');
      });

      it('should fall back to title when caption is absent and default correctIndex is 0', () => {
        const legacy = {
          id: 'c1',
          kind: 'multiple-choice',
          title: 'Fallback title',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          options: [{ id: 'x', text: 'Only' }],
          correctOptionId: 'missing',
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect(result.kind).toBe('select');
        const select = result as SelectCard;
        expect(select.promptKnown).toBe('Fallback title');
        expect(select.correctIndex).toBe(0);
      });
    });

    describe('memory card', () => {
      it('should pass through a valid modern memory card with complete pairs', () => {
        const card: MemoryCard = {
          id: 'c1',
          kind: 'memory',
          title: 'Memory',
          appearance: { theme: 'default', fontSize: 'md' },
          promptKnown: 'Front',
          pairs: [{ known: 'K1', learning: 'L1' }],
        };
        const result = normalizeLegacyCard(card);
        expect(result).toBe(card);
      });

      it('should normalize legacy memory pairs with known and learning', () => {
        const legacy = {
          id: 'c1',
          kind: 'memory',
          title: 'Memory',
          promptKnown: 'Front prompt',
          pairs: [{ known: 'K1', learning: 'L1' }],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as MemoryCard).promptKnown).toBe('Front prompt');
        expect((result as MemoryCard).pairs[0]).toEqual({ known: 'K1', learning: 'L1' });
      });

      it('should normalize legacy memory pairs with front and back', () => {
        const legacy = {
          id: 'c1',
          kind: 'memory',
          title: 'Memory',
          prompt: 'Prompt',
          pairs: [{ front: 'Front', back: 'Back' }],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as MemoryCard).promptKnown).toBe('Prompt');
        expect((result as MemoryCard).pairs[0]).toEqual({ known: 'Back', learning: 'Front' });
      });

      it('should handle empty pairs array', () => {
        const legacy = {
          id: 'c1',
          kind: 'memory',
          title: 'Memory',
          pairs: [],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as MemoryCard).pairs).toEqual([]);
      });
    });

    describe('symbol card', () => {
      it('should fill missing fields for legacy symbol card', () => {
        const legacy = {
          id: 'c1',
          kind: 'symbol',
          title: 'Symbol',
          prompt: 'Symbol prompt',
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as SymbolCard).promptKnown).toBe('Symbol prompt');
        expect((result as SymbolCard).direction).toBe('known-to-learning');
      });

      it('should preserve existing symbol fields', () => {
        const card = {
          id: 'c1',
          kind: 'symbol',
          title: 'Symbol',
          promptKnown: 'Existing',
          direction: 'learning-to-known',
        } as unknown as Card;

        const result = normalizeLegacyCard(card);
        expect((result as SymbolCard).promptKnown).toBe('Existing');
        expect((result as SymbolCard).direction).toBe('learning-to-known');
      });
    });

    describe('sound card', () => {
      it('should fill missing fields for legacy sound card', () => {
        const legacy = {
          id: 'c1',
          kind: 'sound',
          title: 'Sound',
          prompt: 'Sound prompt',
          audioLabel: 'Label',
          options: ['Opt1', 'Opt2'],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as SoundCard).promptKnown).toBe('Sound prompt');
        expect((result as SoundCard).audioLabelLearning).toBe('Label');
        expect((result as SoundCard).optionsKnown).toEqual(['Opt1', 'Opt2']);
        expect((result as SoundCard).direction).toBe('known-to-learning');
      });
    });

    describe('timed card', () => {
      it('should fill missing fields for legacy timed card', () => {
        const legacy = {
          id: 'c1',
          kind: 'timed',
          title: 'Timed',
          question: 'Timed question',
          options: ['A', 'B'],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as TimedCard).promptKnown).toBe('Timed question');
        expect((result as TimedCard).optionsLearning).toEqual(['A', 'B']);
        expect((result as TimedCard).direction).toBe('known-to-learning');
      });
    });

    describe('keyboard card', () => {
      it('should fill missing fields for legacy keyboard card', () => {
        const legacy = {
          id: 'c1',
          kind: 'keyboard',
          title: 'Keyboard',
          prompt: 'Keyboard prompt',
          acceptedAnswers: ['ans1', 'ans2'],
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as KeyboardCard).promptKnown).toBe('Keyboard prompt');
        expect((result as KeyboardCard).acceptedAnswersKnown).toEqual(['ans1', 'ans2']);
        expect((result as KeyboardCard).direction).toBe('known-to-learning');
      });
    });

    describe('draw card', () => {
      it('should fill missing fields for legacy draw card', () => {
        const legacy = {
          id: 'c1',
          kind: 'draw',
          title: 'Draw',
          prompt: 'Draw prompt',
          referenceHint: 'Hint',
        } as unknown as Card;

        const result = normalizeLegacyCard(legacy);
        expect((result as DrawCard).promptKnown).toBe('Draw prompt');
        expect((result as DrawCard).referenceHintKnown).toBe('Hint');
      });
    });
  });

  describe('normalizeLegacyCards', () => {
    it('should normalize an array of mixed legacy cards', () => {
      const cards: Card[] = [
        {
          id: 'c1',
          kind: 'select',
          title: 'Select',
          question: 'Q1',
          options: ['A'],
        } as unknown as Card,
        {
          id: 'c2',
          kind: 'symbol',
          title: 'Symbol',
          prompt: 'P1',
        } as unknown as Card,
      ];

      const result = normalizeLegacyCards(cards);
      expect(result).toHaveLength(2);
      expect((result[0] as SelectCard).promptKnown).toBe('Q1');
      expect((result[1] as SymbolCard).promptKnown).toBe('P1');
    });

    it('should return empty array for empty input', () => {
      expect(normalizeLegacyCards([])).toEqual([]);
    });

    it('should pass through modern cards unchanged', () => {
      const modern: Card[] = [
        {
          id: 'c1',
          kind: 'select',
          title: 'Modern',
          appearance: { theme: 'default', fontSize: 'md' },
          promptKnown: 'Hello',
          optionsLearning: ['A'],
          direction: 'known-to-learning',
        } as unknown as Card,
      ];

      const result = normalizeLegacyCards(modern);
      expect(result).toHaveLength(1);
    });
  });

  describe('new card kinds (flip, cloze, code-trace)', () => {
    it('should pass through a modern flip card', () => {
      const card = {
        id: 'flip-1',
        kind: 'flip',
        title: 'Flip',
        appearance: { theme: 'default', fontSize: 'md' },
        front: 'Привет',
        back: 'Hello',
      } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({ kind: 'flip', front: 'Привет', back: 'Hello' });
    });

    it('should fill empty front/back for legacy flip cards', () => {
      const card = { id: 'flip-1', kind: 'flip', title: 'Flip' } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({ kind: 'flip', front: '', back: '' });
    });

    it('should pass through a modern cloze card', () => {
      const card = {
        id: 'cloze-1',
        kind: 'cloze',
        title: 'Cloze',
        appearance: { theme: 'default', fontSize: 'md' },
        promptKnown: 'I ___ coffee.',
        options: ['drinks', 'drink'],
        correctIndex: 1,
        correctAnswer: 'drink',
        acceptedAnswers: ['drink'],
      } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({
        kind: 'cloze',
        promptKnown: 'I ___ coffee.',
        correctAnswer: 'drink',
      });
    });

    it('should fill missing correctAnswer for legacy cloze cards', () => {
      const card = {
        id: 'cloze-1',
        kind: 'cloze',
        title: 'Cloze',
        prompt: 'I ___ coffee.',
      } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({
        kind: 'cloze',
        promptKnown: 'I ___ coffee.',
        correctAnswer: '',
      });
    });

    it('should fill outputOptions from legacy options for code-trace cards', () => {
      const card = {
        id: 'trace-1',
        kind: 'code-trace',
        title: 'Trace',
        options: ['0', '1'],
      } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({ kind: 'code-trace', outputOptions: ['0', '1'] });
    });

    it('should pass through a modern code-trace card', () => {
      const card = {
        id: 'trace-1',
        kind: 'code-trace',
        title: 'Trace',
        appearance: { theme: 'default', fontSize: 'md' },
        code: { language: 'cpp', code: 'int main() {}' },
        outputOptions: ['0', '1'],
        correctIndex: 0,
      } as unknown as Card;

      const result = normalizeLegacyCard(card);
      expect(result).toMatchObject({ kind: 'code-trace', outputOptions: ['0', '1'] });
    });
  });
});
