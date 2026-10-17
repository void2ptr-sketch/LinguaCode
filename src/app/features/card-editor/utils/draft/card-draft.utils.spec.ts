import { describe, expect, it } from 'vitest';
import { emptyCardDraft, cardToDraft, cardSummary } from './card-draft.utils';
import type { Card } from '../../../../entities/card/model';

const defaultAppearance = { theme: 'azure-blue' as const, fontSize: 'md' as const };

describe('card-draft.utils', () => {
  // ── emptyCardDraft ──

  describe('emptyCardDraft', () => {
    it('should create select card draft', () => {
      const draft = emptyCardDraft(
        'select',
        defaultAppearance,
      ) as import('../../types').SelectCardDraft;
      expect(draft.kind).toBe('select');
      expect(draft.title).toBe('');
      expect(draft.optionsLearning).toEqual(['', '']);
      expect(draft.optionsKnown).toEqual(['', '']);
    });

    it('should create code-select card draft', () => {
      const draft = emptyCardDraft(
        'code-select',
        defaultAppearance,
      ) as import('../../types').CodeSelectCardDraft;
      expect(draft.kind).toBe('code-select');
      expect(draft.caption).toBe('');
      expect(draft.prompt).toEqual({ code: '', language: 'perl' });
    });

    it('should create memory card draft', () => {
      const draft = emptyCardDraft(
        'memory',
        defaultAppearance,
      ) as import('../../types').MemoryCardDraft;
      expect(draft.kind).toBe('memory');
      expect(draft.pairs).toHaveLength(1);
    });

    it('should create symbol card draft', () => {
      const draft = emptyCardDraft(
        'symbol',
        defaultAppearance,
      ) as import('../../types').SymbolCardDraft;
      expect(draft.kind).toBe('symbol');
      expect(draft.symbols).toEqual(['', '']);
    });

    it('should create sound card draft', () => {
      const draft = emptyCardDraft(
        'sound',
        defaultAppearance,
      ) as import('../../types').SoundCardDraft;
      expect(draft.kind).toBe('sound');
      expect(draft.audioLabelLearning).toBe('');
    });

    it('should create timed card draft', () => {
      const draft = emptyCardDraft(
        'timed',
        defaultAppearance,
      ) as import('../../types').TimedCardDraft;
      expect(draft.kind).toBe('timed');
      expect(draft.timeLimitSec).toBe(30);
    });

    it('should create keyboard card draft', () => {
      const draft = emptyCardDraft(
        'keyboard',
        defaultAppearance,
      ) as import('../../types').KeyboardCardDraft;
      expect(draft.kind).toBe('keyboard');
      expect(draft.acceptedAnswersKnown).toEqual(['']);
    });

    it('should create draw card draft', () => {
      const draft = emptyCardDraft(
        'draw',
        defaultAppearance,
      ) as import('../../types').DrawCardDraft;
      expect(draft.kind).toBe('draw');
      expect(draft.targetCharacter).toBe('');
      expect(draft.strokeGuides).toEqual([]);
    });

    it('should create tone card draft', () => {
      const draft = emptyCardDraft(
        'tone',
        defaultAppearance,
      ) as import('../../types').ToneCardDraft;
      expect(draft.kind).toBe('tone');
      expect(draft.syllableBase).toBe('');
    });

    it('should create reading card draft', () => {
      const draft = emptyCardDraft(
        'reading',
        defaultAppearance,
      ) as import('../../types').ReadingCardDraft;
      expect(draft.kind).toBe('reading');
      expect(draft.optionsLearning).toEqual(['', '']);
    });

    it('should copy appearance', () => {
      const draft = emptyCardDraft('select', {
        ...defaultAppearance,
      }) as import('../../types').SelectCardDraft;
      expect(draft.appearance).toEqual(defaultAppearance);
    });
  });

  // ── cardToDraft ──

  describe('cardToDraft', () => {
    it('should convert select card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'select',
        title: 'Test Card',
        direction: 'known-to-learning',
        promptKnown: 'Prompt',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').SelectCardDraft;
      expect(draft.kind).toBe('select');
      expect(draft.title).toBe('Test Card');
      expect(draft.promptKnown).toBe('Prompt');
    });

    it('should convert code-select card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'code-select',
        title: 'Test',
        caption: 'Caption',
        prompt: { code: 'print "hi";', language: 'perl' },
        options: [{ code: 'print "hi";', language: 'perl' }],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
      };
      const draft = cardToDraft(card) as import('../../types').CodeSelectCardDraft;
      expect(draft.kind).toBe('code-select');
      expect(draft.caption).toBe('Caption');
    });

    it('should convert memory card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'memory',
        title: 'Test',
        promptKnown: 'P',
        pairs: [{ known: 'A', learning: 'B', learningLexeme: { primary: 'B', script: 'latn' } }],
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').MemoryCardDraft;
      expect(draft.kind).toBe('memory');
      expect(draft.pairs).toHaveLength(1);
    });

    it('should convert symbol card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'symbol',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        symbols: ['A', 'B'],
        symbolLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').SymbolCardDraft;
      expect(draft.kind).toBe('symbol');
    });

    it('should convert sound card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'sound',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        audioLabelLearning: 'Label',
        optionsKnown: ['A', 'B'],
        optionsLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').SoundCardDraft;
      expect(draft.kind).toBe('sound');
    });

    it('should convert timed card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'timed',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        optionsLearning: ['A', 'B'],
        optionsLexemes: [],
        correctIndex: 0,
        timeLimitSec: 60,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').TimedCardDraft;
      expect(draft.kind).toBe('timed');
      expect(draft.timeLimitSec).toBe(60);
    });

    it('should convert keyboard card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'keyboard',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        acceptedAnswersKnown: ['a', 'b'],
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').KeyboardCardDraft;
      expect(draft.kind).toBe('keyboard');
    });

    it('should convert draw card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'draw',
        title: 'Test',
        promptKnown: 'P',
        referenceHintKnown: '',
        targetCharacter: '水',
        radicalHint: '',
        practiceMode: 'freehand',
        strokeGuides: [],
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').DrawCardDraft;
      expect(draft.kind).toBe('draw');
      expect(draft.targetCharacter).toBe('水');
    });

    it('should convert tone card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'tone',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        syllableBase: 'ni',
        toneOptions: [1, 2, 3, 4],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').ToneCardDraft;
      expect(draft.kind).toBe('tone');
    });

    it('should convert reading card to draft', () => {
      const card: Card = {
        id: 'c1',
        kind: 'reading',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        optionsLearning: ['A', 'B'],
        optionsLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').ReadingCardDraft;
      expect(draft.kind).toBe('reading');
    });

    it('should deep copy arrays', () => {
      const card: Card = {
        id: 'c1',
        kind: 'select',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'P',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      const draft = cardToDraft(card) as import('../../types').SelectCardDraft;
      const mutableDraft = draft as unknown as { optionsLearning: string[] };
      mutableDraft.optionsLearning[0] = 'X';
      expect(card.optionsLearning[0]).toBe('A');
    });
  });

  // ── cardSummary ──

  describe('cardSummary', () => {
    it('should return promptKnown for select card', () => {
      const card: Card = {
        id: 'c1',
        kind: 'select',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'My prompt',
        optionsLearning: ['A'],
        optionsKnown: ['A'],
        optionsLexemes: [],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        promptLexeme: {
          primary: 'P',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
        },
        audioUrl: '',
      };
      expect(cardSummary(card)).toBe('My prompt');
    });

    it('should return caption for code-select card', () => {
      const card: Card = {
        id: 'c1',
        kind: 'code-select',
        title: 'Test',
        caption: 'My caption',
        prompt: { code: 'print "hi";', language: 'perl' },
        options: [{ code: 'print "hi";', language: 'perl' }],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
      };
      expect(cardSummary(card)).toBe('My caption');
    });

    it('should return first line of code when no caption', () => {
      const card: Card = {
        id: 'c1',
        kind: 'code-select',
        title: 'Test',
        prompt: { code: 'line1\nline2', language: 'perl' },
        options: [{ code: 'code', language: 'perl' }],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
      };
      expect(cardSummary(card)).toBe('line1');
    });

    it('should return title when no caption and no code', () => {
      const card: Card = {
        id: 'c1',
        kind: 'code-select',
        title: 'Test',
        prompt: { code: '', language: 'perl' },
        options: [{ code: '', language: 'perl' }],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
      };
      expect(cardSummary(card)).toBe('Test');
    });

    it('should trim caption', () => {
      const card: Card = {
        id: 'c1',
        kind: 'code-select',
        title: 'Test',
        caption: '  Caption  ',
        prompt: { code: 'code', language: 'perl' },
        options: [{ code: 'code', language: 'perl' }],
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
      };
      expect(cardSummary(card)).toBe('Caption');
    });
  });
});
