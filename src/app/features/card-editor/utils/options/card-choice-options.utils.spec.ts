import { describe, it, expect } from 'vitest';
import type {
  SelectCardDraft,
  SymbolCardDraft,
  TimedCardDraft,
  ReadingCardDraft,
  ToneCardDraft,
} from '../../types';
import { emptyLexemeCardDraft, emptyOptionLexemes } from '../../types';
import {
  resolveChoiceOptionsConfig,
  resolveChoiceOptionTexts,
  resolveChoiceOptionLexemes,
  applyChoiceOptionsState,
} from './card-choice-options.utils';

const appearance = { theme: 'azure-blue', fontSize: 'md' as const };

describe('resolveChoiceOptionsConfig', () => {
  it('should return empty config for null', () => {
    expect(resolveChoiceOptionsConfig(null)).toEqual({
      title: '',
      optionLabelPrefix: '',
      showCorrectRadio: true,
    });
  });

  it('should return config for reading', () => {
    const draft: ReadingCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'reading',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionsConfig(draft)).toEqual({
      title: 'Варианты чтения',
      optionLabelPrefix: 'Чтение',
      showCorrectRadio: true,
    });
  });

  it('should return config for symbol', () => {
    const draft: SymbolCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'symbol',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      symbols: ['👋'],
      symbolLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionsConfig(draft)).toEqual({
      title: 'Символы',
      optionLabelPrefix: 'Символ',
      showCorrectRadio: true,
    });
  });

  it('should return config for select', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionsConfig(draft)).toEqual({
      title: 'Варианты (новый)',
      optionLabelPrefix: 'Ответ',
      showCorrectRadio: true,
    });
  });

  it('should return config for timed', () => {
    const draft: TimedCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'timed',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A', 'B'],
      optionsLexemes: [],
      correctIndex: 0,
      timeLimitSec: 30,
      appearance,
    };
    expect(resolveChoiceOptionsConfig(draft)).toEqual({
      title: 'Варианты (новый)',
      optionLabelPrefix: 'Ответ',
      showCorrectRadio: true,
    });
  });

  it('should return default config for tone', () => {
    const draft: ToneCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'tone',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionsConfig(draft)).toEqual({
      title: 'Варианты',
      optionLabelPrefix: 'Вариант',
      showCorrectRadio: true,
    });
  });
});

describe('resolveChoiceOptionTexts', () => {
  it('should return empty array for null', () => {
    expect(resolveChoiceOptionTexts(null)).toEqual([]);
  });

  it('should return symbols for symbol kind', () => {
    const draft: SymbolCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'symbol',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      symbols: ['👋', '🔥'],
      symbolLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionTexts(draft)).toEqual(['👋', '🔥']);
  });

  it('should return empty array for tone kind', () => {
    const draft: ToneCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'tone',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionTexts(draft)).toEqual([]);
  });

  it('should return optionsLearning for select kind', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionTexts(draft)).toEqual(['A', 'B']);
  });

  it('should return optionsLearning for reading kind', () => {
    const draft: ReadingCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'reading',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['X', 'Y'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionTexts(draft)).toEqual(['X', 'Y']);
  });

  it('should return optionsLearning for timed kind', () => {
    const draft: TimedCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'timed',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['1', '2'],
      optionsLexemes: [],
      correctIndex: 0,
      timeLimitSec: 30,
      appearance,
    };
    expect(resolveChoiceOptionTexts(draft)).toEqual(['1', '2']);
  });
});

describe('resolveChoiceOptionLexemes', () => {
  it('should return empty array for null', () => {
    expect(resolveChoiceOptionLexemes(null)).toEqual([]);
  });

  it('should return symbolLexemes for symbol kind', () => {
    const lexemes = emptyOptionLexemes(2);
    const draft: SymbolCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'symbol',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      symbols: ['👋'],
      symbolLexemes: lexemes,
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionLexemes(draft)).toEqual(lexemes);
  });

  it('should return empty array for tone kind', () => {
    const draft: ToneCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'tone',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4],
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionLexemes(draft)).toEqual([]);
  });

  it('should return optionsLexemes for select kind', () => {
    const lexemes = emptyOptionLexemes(2);
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: lexemes,
      correctIndex: 0,
      appearance,
    };
    expect(resolveChoiceOptionLexemes(draft)).toEqual(lexemes);
  });
});

describe('applyChoiceOptionsState', () => {
  it('should update optionsLearning for select', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const state = { options: ['X', 'Y'], lexemes: [], correctIndex: 1 };
    const result = applyChoiceOptionsState(draft, state);
    expect(result).toMatchObject({
      optionsLearning: ['X', 'Y'],
      optionsLexemes: [],
      correctIndex: 1,
    });
  });

  it('should update optionsLearning for reading', () => {
    const draft: ReadingCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'reading',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A'],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const state = { options: ['B'], lexemes: [], correctIndex: 0 };
    const result = applyChoiceOptionsState(draft, state);
    expect(result).toMatchObject({ optionsLearning: ['B'] });
  });

  it('should update optionsLearning for timed', () => {
    const draft: TimedCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'timed',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      optionsLearning: ['A'],
      optionsLexemes: [],
      correctIndex: 0,
      timeLimitSec: 30,
      appearance,
    };
    const state = { options: ['B'], lexemes: [], correctIndex: 0 };
    const result = applyChoiceOptionsState(draft, state);
    expect(result).toMatchObject({ optionsLearning: ['B'] });
  });

  it('should update symbols for symbol kind', () => {
    const draft: SymbolCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'symbol',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Hint',
      symbols: ['👋'],
      symbolLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const state = { options: ['🔥'], lexemes: [], correctIndex: 0 };
    const result = applyChoiceOptionsState(draft, state);
    expect(result).toMatchObject({ symbols: ['🔥'] });
  });
});
