import { describe, expect, it } from 'vitest';

import { CardAppearance } from '../../../core/models';
import type { Card } from '../../../core/models';
import { cardToDraft, cardSummary, emptyCardDraft } from './card-draft.utils';
import type {
  CardDraft,
  CodeSelectCardDraft,
  DrawCardDraft,
  KeyboardCardDraft,
  LexemeCardDraft,
  MemoryCardDraft,
  ReadingCardDraft,
  SelectCardDraft,
  SoundCardDraft,
  SymbolCardDraft,
  TimedCardDraft,
  ToneCardDraft,
} from '../types/card-draft.types';

describe('card-draft.utils', () => {
  const defaultAppearance: CardAppearance = {
    theme: 'default',
    fontSize: 'md',
  };

  describe('emptyCardDraft', () => {
    it('should create an empty select card draft', () => {
      const draft = emptyCardDraft('select', defaultAppearance) as SelectCardDraft;
      expect(draft.kind).toBe('select');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.optionsLearning).toEqual(['', '']);
      expect(draft.optionsKnown).toEqual(['', '']);
      expect(draft.correctIndex).toBe(0);
      expect(draft.appearance).toEqual(defaultAppearance);
      expect(draft.courseId).toBe('');
      expect(draft.lessonId).toBe('');
      expect(draft.scenarioId).toBe('');
    });

    it('should create an empty code-select card draft', () => {
      const draft = emptyCardDraft('code-select', defaultAppearance) as CodeSelectCardDraft;
      expect(draft.kind).toBe('code-select');
      expect(draft.title).toBe('');
      expect(draft.caption).toBe('');
      expect(draft.prompt.code).toBe('');
      expect(draft.prompt.language).toBe('perl');
      expect(draft.options).toHaveLength(2);
      expect(draft.options[0].code).toBe('');
      expect(draft.options[0].language).toBe('perl');
      expect(draft.correctIndex).toBe(0);
    });

    it('should create an empty memory card draft', () => {
      const draft = emptyCardDraft('memory', defaultAppearance) as MemoryCardDraft;
      expect(draft.kind).toBe('memory');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.pairs).toHaveLength(1);
      expect(draft.pairs[0].known).toBe('');
      expect(draft.pairs[0].learning).toBe('');
    });

    it('should create an empty symbol card draft', () => {
      const draft = emptyCardDraft('symbol', defaultAppearance) as SymbolCardDraft;
      expect(draft.kind).toBe('symbol');
      expect(draft.title).toBe('');
      expect(draft.symbols).toEqual(['', '']);
      expect(draft.correctIndex).toBe(0);
      expect(draft.direction).toBe('known-to-learning');
    });

    it('should create an empty sound card draft', () => {
      const draft = emptyCardDraft('sound', defaultAppearance) as SoundCardDraft;
      expect(draft.kind).toBe('sound');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.audioLabelLearning).toBe('');
      expect(draft.optionsKnown).toEqual(['', '']);
      expect(draft.correctIndex).toBe(0);
    });

    it('should create an empty timed card draft', () => {
      const draft = emptyCardDraft('timed', defaultAppearance) as TimedCardDraft;
      expect(draft.kind).toBe('timed');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.optionsLearning).toEqual(['', '']);
      expect(draft.timeLimitSec).toBe(30);
      expect(draft.correctIndex).toBe(0);
    });

    it('should create an empty keyboard card draft', () => {
      const draft = emptyCardDraft('keyboard', defaultAppearance) as KeyboardCardDraft;
      expect(draft.kind).toBe('keyboard');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.acceptedAnswersKnown).toEqual(['']);
    });

    it('should create an empty draw card draft', () => {
      const draft = emptyCardDraft('draw', defaultAppearance) as DrawCardDraft;
      expect(draft.kind).toBe('draw');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.referenceHintKnown).toBe('');
      expect(draft.targetCharacter).toBe('');
      expect(draft.radicalHint).toBe('');
      expect(draft.strokeGuides).toEqual([]);
    });

    it('should create an empty tone card draft', () => {
      const draft = emptyCardDraft('tone', defaultAppearance) as ToneCardDraft;
      expect(draft.kind).toBe('tone');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.syllableBase).toBe('');
      expect(draft.toneOptions).toHaveLength(4);
      expect(draft.correctIndex).toBe(0);
    });

    it('should create an empty reading card draft', () => {
      const draft = emptyCardDraft('reading', defaultAppearance) as ReadingCardDraft;
      expect(draft.kind).toBe('reading');
      expect(draft.title).toBe('');
      expect(draft.promptKnown).toBe('');
      expect(draft.optionsLearning).toEqual(['', '']);
      expect(draft.correctIndex).toBe(0);
    });
  });

  describe('cardToDraft', () => {
    function createSelectCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-1',
        kind: 'select',
        title: 'Test Select',
        promptKnown: 'What is this?',
        optionsLearning: ['Option A', 'Option B'],
        optionsKnown: ['A', 'B'],
        correctIndex: 0,
        direction: 'known-to-learning',
        appearance: { ...defaultAppearance },
        promptLexeme: { primary: 'Test', script: 'latn' },
        audioUrl: '',
        ...overrides,
      } as Card;
    }

    function createMemoryCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-2',
        kind: 'memory',
        title: 'Test Memory',
        promptKnown: 'Memory prompt',
        pairs: [
          { known: 'A', learning: 'B', learningLexeme: { primary: 'B', script: 'latn' } },
        ],
        appearance: { ...defaultAppearance },
        promptLexeme: { primary: 'Test', script: 'latn' },
        audioUrl: '',
        ...overrides,
      } as Card;
    }

    function createCodeSelectCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-3',
        kind: 'code-select',
        title: 'Test Code',
        caption: 'Code caption',
        prompt: { code: 'console.log()', language: 'typescript' },
        options: [
          { code: 'console.log()', language: 'typescript' },
          { code: 'print()', language: 'python' },
        ],
        correctIndex: 0,
        appearance: { ...defaultAppearance },
        ...overrides,
      } as Card;
    }

    function createDrawCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-4',
        kind: 'draw',
        title: 'Test Draw',
        promptKnown: 'Draw this',
        referenceHintKnown: 'Hint',
        targetCharacter: '水',
        radicalHint: '氵',
        strokeGuides: [{ order: 0, path: 'M0,0 L10,10' }],
        appearance: { ...defaultAppearance },
        promptLexeme: { primary: 'Test', script: 'latn' },
        audioUrl: '',
        ...overrides,
      } as Card;
    }

    it('should convert a select card to draft preserving all fields', () => {
      const card = createSelectCard();
      const draft = cardToDraft(card) as SelectCardDraft;

      expect(draft.kind).toBe('select');
      expect(draft.title).toBe('Test Select');
      expect(draft.promptKnown).toBe('What is this?');
      expect(draft.optionsLearning).toEqual(['Option A', 'Option B']);
      expect(draft.optionsKnown).toEqual(['A', 'B']);
      expect(draft.correctIndex).toBe(0);
      expect(draft.direction).toBe('known-to-learning');
    });

    it('should deep copy arrays when converting select card', () => {
      const card = createSelectCard() as Card & { kind: 'select' };
      const draft = cardToDraft(card) as SelectCardDraft;

      // Verify the draft array is a separate copy
      expect(draft.optionsLearning.length).toBe(card.optionsLearning.length);
      expect(draft.optionsLearning).not.toBe(card.optionsLearning);
    });

    it('should convert a memory card to draft', () => {
      const card = createMemoryCard() as Card & { kind: 'memory' };
      const draft = cardToDraft(card) as MemoryCardDraft;

      expect(draft.kind).toBe('memory');
      expect(draft.title).toBe('Test Memory');
      expect(draft.promptKnown).toBe('Memory prompt');
      expect(draft.pairs).toHaveLength(1);
      expect(draft.pairs[0].known).toBe('A');
      expect(draft.pairs[0].learning).toBe('B');
    });

    it('should deep copy pairs when converting memory card', () => {
      const card = createMemoryCard() as Card & { kind: 'memory' };
      const draft = cardToDraft(card) as MemoryCardDraft;

      draft.pairs[0].known = 'Modified';
      expect(card.pairs[0].known).toBe('A');
    });

    it('should convert a code-select card to draft', () => {
      const card = createCodeSelectCard();
      const draft = cardToDraft(card) as CodeSelectCardDraft;

      expect(draft.kind).toBe('code-select');
      expect(draft.title).toBe('Test Code');
      expect(draft.caption).toBe('Code caption');
      expect(draft.prompt.code).toBe('console.log()');
      expect(draft.prompt.language).toBe('typescript');
    });

    it('should deep copy code options when converting code-select card', () => {
      const card = createCodeSelectCard() as Card & { kind: 'code-select' };
      const draft = cardToDraft(card) as CodeSelectCardDraft;

      draft.options[0].code = 'Modified';
      expect(card.options[0].code).toBe('console.log()');
    });

    it('should convert a draw card to draft with stroke guides', () => {
      const card = createDrawCard() as Card & { kind: 'draw' };
      const draft = cardToDraft(card) as DrawCardDraft;

      expect(draft.kind).toBe('draw');
      expect(draft.title).toBe('Test Draw');
      expect(draft.promptKnown).toBe('Draw this');
      expect(draft.referenceHintKnown).toBe('Hint');
      expect(draft.targetCharacter).toBe('水');
      expect(draft.radicalHint).toBe('氵');
      expect(draft.strokeGuides).toHaveLength(1);
    });

    it('should deep copy stroke guides when converting draw card', () => {
      const card = createDrawCard() as Card & { kind: 'draw' };
      const draft = cardToDraft(card) as DrawCardDraft;

      draft.strokeGuides[0].path = 'Modified';
      expect(card.strokeGuides![0].path).toBe('M0,0 L10,10');
    });

    it('should handle missing audioUrl as empty string', () => {
      const card = createSelectCard({ audioUrl: undefined });
      const draft = cardToDraft(card) as LexemeCardDraft;

      expect(draft.audioUrl).toBe('');
    });

    it('should preserve courseId, lessonId, scenarioId from card', () => {
      const card = createSelectCard({
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
      });
      const draft = cardToDraft(card);

      expect(draft.courseId).toBe('course-1');
      expect(draft.lessonId).toBe('lesson-1');
      expect(draft.scenarioId).toBe('scenario-1');
    });
  });

  describe('cardSummary', () => {
    function createSelectCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-1',
        kind: 'select',
        title: 'Test Title',
        promptKnown: 'What is this?',
        optionsLearning: ['A', 'B'],
        correctIndex: 0,
        direction: 'known-to-learning',
        appearance: { ...defaultAppearance },
        ...overrides,
      } as Card;
    }

    function createCodeSelectCard(overrides?: Partial<Card>): Card {
      return {
        id: 'card-2',
        kind: 'code-select',
        title: 'Code Title',
        caption: 'Code Caption',
        prompt: { code: 'console.log()', language: 'typescript' },
        options: [{ code: 'console.log()', language: 'typescript' }],
        correctIndex: 0,
        appearance: { ...defaultAppearance },
        ...overrides,
      } as Card;
    }

    it('should return promptKnown for select cards', () => {
      const card = createSelectCard();
      expect(cardSummary(card)).toBe('What is this?');
    });

    it('should return caption for code-select cards when caption exists', () => {
      const card = createCodeSelectCard();
      expect(cardSummary(card)).toBe('Code Caption');
    });

    it('should return first line of code when caption is empty for code-select', () => {
      const card = createCodeSelectCard({ caption: '' });
      expect(cardSummary(card)).toBe('console.log()');
    });

    it('should return title as fallback when caption and code are empty', () => {
      const card = createCodeSelectCard({
        caption: '',
        prompt: { code: '', language: 'typescript' },
      });
      expect(cardSummary(card)).toBe('Code Title');
    });

    it('should handle multiline code and return first line', () => {
      const card = createCodeSelectCard({
        caption: '',
        prompt: { code: 'line1\nline2\nline3', language: 'typescript' },
      });
      expect(cardSummary(card)).toBe('line1');
    });

    it('should trim caption and code when generating summary', () => {
      const card = createCodeSelectCard({ caption: '  Trimmed  ' });
      expect(cardSummary(card)).toBe('Trimmed');
    });
  });
});
