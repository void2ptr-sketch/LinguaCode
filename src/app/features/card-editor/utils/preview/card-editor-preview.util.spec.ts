import { describe, it, expect } from 'vitest';
import { fallbackPreviewCard } from './card-editor-preview.util';
import { DEFAULT_CARD_DIRECTION } from '../../types';
import type {
  SelectCardDraft,
  CodeSelectCardDraft,
  MemoryCardDraft,
  SymbolCardDraft,
} from '../../types';
import type { SoundCardDraft, TimedCardDraft, KeyboardCardDraft, DrawCardDraft } from '../../types';
import type { ToneCardDraft, ReadingCardDraft } from '../../types';
import { emptyLexemeCardDraft } from '../../types';
import type { SelectCard, CodeSelectCard } from '../../../../entities/card/model';
import { emptyLexemeDraftFields } from '../../../../entities/chinese/lib/phonetics';

const appearance = { theme: 'azure-blue', fontSize: 'md' as const };

describe('fallbackPreviewCard', () => {
  it('should return select card with defaults', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: '',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      optionsLearning: [],
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-1');
    expect(result).toMatchObject({
      id: 'preview-1',
      kind: 'select',
      title: 'New card',
      direction: DEFAULT_CARD_DIRECTION,
      correctIndex: 0,
    });
    const select = result as SelectCard;
    expect(select.optionsLearning).toEqual(['Option 1', 'Option 2']);
    expect(select.optionsKnown).toEqual(['Answer 1', 'Answer 2']);
  });

  it('should preserve draft title when provided', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'My Card',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      optionsLearning: [],
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-1');
    expect(result.title).toBe('My Card');
  });

  it('should return code-select card with default options', () => {
    const draft: CodeSelectCardDraft = {
      kind: 'code-select',
      title: 'Test',
      caption: 'Test caption',
      prompt: { code: 'console.log();', language: 'typescript' },
      options: [{ code: 'A', language: 'typescript' }],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-2');
    expect(result).toMatchObject({
      id: 'preview-2',
      kind: 'code-select',
      caption: 'Test caption',
      correctIndex: 0,
    });
    // Always generates default options — never empty even if draft.options is empty/undefined
    const codeSelect = result as CodeSelectCard;
    expect(codeSelect.options).toHaveLength(2);
    expect(codeSelect.options[0].code).toBe('// option 1');
  });

  it('should return memory card with valid pair', () => {
    const draft: MemoryCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'memory',
      title: 'Test',
      promptKnown: '',
      pairs: [],
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-3');
    expect(result).toMatchObject({
      kind: 'memory',
      promptKnown: 'Hint',
    });
    const pair = (
      result as unknown as {
        pairs: { known: string; learning: string; learningLexeme: { script: string } }[];
      }
    ).pairs[0];
    expect(pair.known).toBe('A');
    expect(pair.learning).toBe('B');
    expect(pair.learningLexeme.script).toBe('latn');
  });

  it('should return symbol card', () => {
    const draft: SymbolCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'symbol',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      symbols: [],
      symbolLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-4');
    expect(result).toMatchObject({
      kind: 'symbol',
      symbols: ['\ud83d\udc4b', '\ud83d\udd25'],
    });
  });

  it('should return sound card', () => {
    const draft: SoundCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'sound',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      audioLabelLearning: '',
      audioLabelLexeme: emptyLexemeDraftFields(),
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-5');
    expect(result).toMatchObject({
      kind: 'sound',
      audioLabelLearning: 'Hello',
      optionsKnown: ['Hi', 'Bye'],
    });
  });

  it('should return timed card with default timeLimitSec', () => {
    const draft: TimedCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'timed',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      optionsLearning: [],
      optionsLexemes: [],
      correctIndex: 0,
      timeLimitSec: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-6');
    expect(result).toMatchObject({
      kind: 'timed',
      timeLimitSec: 30,
    });
  });

  it('should return keyboard card', () => {
    const draft: KeyboardCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'keyboard',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      acceptedAnswersKnown: [],
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-7');
    expect(result).toMatchObject({
      kind: 'keyboard',
      acceptedAnswersKnown: ['answer'],
    });
  });

  it('should return draw card', () => {
    const draft: DrawCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'draw',
      title: 'Test',
      promptKnown: '',
      referenceHintKnown: '',
      practiceMode: undefined,
      targetCharacter: '',
      radicalHint: '',
      strokeGuides: [],
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-8');
    expect(result).toMatchObject({
      kind: 'draw',
      referenceHintKnown: 'Reference',
      practiceMode: 'freehand',
    });
  });

  it('should return tone card with default toneOptions', () => {
    const draft: ToneCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'tone',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      syllableBase: '',
      toneOptions: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-9');
    expect(result).toMatchObject({
      kind: 'tone',
      syllableBase: 'ma',
    });
    expect((result as unknown as { toneOptions: number[] }).toneOptions).toEqual([1, 2, 3, 4]);
  });

  it('should return reading card', () => {
    const draft: ReadingCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'reading',
      title: 'Test',
      direction: DEFAULT_CARD_DIRECTION,
      promptKnown: '',
      optionsLearning: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-10');
    expect(result).toMatchObject({
      kind: 'reading',
      optionsLearning: ['\u9280\u884c', 'y\u00ednx\u00edng'],
    });
  });

  it('should return flip card with fallback sides', () => {
    const result = fallbackPreviewCard(
      {
        kind: 'flip',
        title: 'Flip',
        front: '',
        back: '',
        audioUrl: '',
        appearance,
      },
      'preview-flip',
    );

    expect(result).toMatchObject({ kind: 'flip', front: 'Front', back: 'Back' });
  });

  it('should return cloze card with fallback answer', () => {
    const draft: import('../../types').ClozeCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'cloze',
      title: 'Cloze',
      promptKnown: '',
      options: [],
      acceptedAnswers: [],
      correctAnswer: '',
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-cloze');

    expect(result).toMatchObject({ kind: 'cloze', correctAnswer: 'brave' });
  });

  it('should return code-trace card with output options', () => {
    const draft: import('../../types').CodeTraceCardDraft = {
      kind: 'code-trace',
      title: 'Trace',
      caption: '',
      question: '',
      code: { code: '', language: 'cpp' },
      outputOptions: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'preview-trace');

    expect(result).toMatchObject({ kind: 'code-trace', outputOptions: ['Hello', 'World'] });
  });
});
