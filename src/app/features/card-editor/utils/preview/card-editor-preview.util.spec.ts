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

  // ── Branch coverage: falsy/undefined paths ──

  it('should use fallback when draft.title is falsy for select', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: null as unknown as string,
      direction: undefined as unknown as typeof DEFAULT_CARD_DIRECTION,
      promptKnown: null as unknown as string,
      optionsLearning: [],
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect(result.title).toBe('New card');
    expect((result as SelectCard).promptKnown).toBe('Hint');
  });

  it('should use fallback direction when undefined for select', () => {
    const draft: SelectCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'select',
      title: 'T',
      direction: undefined as unknown as typeof DEFAULT_CARD_DIRECTION,
      promptKnown: 'P',
      optionsLearning: [],
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as SelectCard).direction).toBe(DEFAULT_CARD_DIRECTION);
  });

  it('should use fallback caption when falsy for code-select', () => {
    const draft: CodeSelectCardDraft = {
      kind: 'code-select',
      title: 'T',
      caption: null as unknown as string,
      prompt: { code: '', language: 'typescript' },
      options: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as CodeSelectCard).caption).toBeUndefined();
  });

  it('should pass through language when provided for code-select', () => {
    const draft: CodeSelectCardDraft = {
      kind: 'code-select',
      title: 'T',
      caption: 'C',
      prompt: { code: '', language: 'typescript' },
      options: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    const codeSelect = result as CodeSelectCard;
    expect(codeSelect.prompt.code).toBe('print "Hello";');
    expect(codeSelect.prompt.language).toBe('typescript');
  });

  it('should use fallback syllableBase when empty for tone', () => {
    const draft: ToneCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'tone',
      title: 'T',
      direction: undefined as unknown as 'known-to-learning' | 'learning-to-known',
      promptKnown: '',
      syllableBase: null as unknown as string,
      toneOptions: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { syllableBase: string }).syllableBase).toBe('ma');
  });

  it('should use fallback promptLexeme primary for draw', () => {
    const draft: DrawCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'draw',
      title: 'T',
      promptKnown: '',
      referenceHintKnown: '',
      practiceMode: undefined,
      targetCharacter: '',
      radicalHint: '',
      strokeGuides: [],
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { targetCharacter: string }).targetCharacter).toBe('');
  });

  it('should use promptLexeme primary when targetCharacter is empty for draw', () => {
    const draft: DrawCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'draw',
      title: 'T',
      promptKnown: '',
      referenceHintKnown: '',
      practiceMode: undefined,
      targetCharacter: '',
      radicalHint: '',
      strokeGuides: [],
      promptLexeme: { ...emptyLexemeDraftFields('hani'), primary: '水' },
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { targetCharacter: string }).targetCharacter).toBe('水');
  });

  it('should use fallback options when options.length > 0 for cloze', () => {
    const draft: import('../../types').ClozeCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'cloze',
      title: 'T',
      promptKnown: '',
      options: ['A', 'B'],
      acceptedAnswers: [],
      correctAnswer: 'A',
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { options?: string[] }).options).toEqual(['A', 'B']);
    expect((result as unknown as { correctIndex?: number }).correctIndex).toBe(0);
    expect((result as unknown as { acceptedAnswers?: string[] }).acceptedAnswers).toBeUndefined();
  });

  it('should use fallback acceptedAnswers when non-empty for cloze', () => {
    const draft: import('../../types').ClozeCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'cloze',
      title: 'T',
      promptKnown: '',
      options: [],
      acceptedAnswers: ['answer'],
      correctAnswer: 'A',
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { acceptedAnswers?: string[] }).acceptedAnswers).toEqual(['answer']);
  });

  it('should use fallback code and pass through language for code-trace', () => {
    const draft: import('../../types').CodeTraceCardDraft = {
      kind: 'code-trace',
      title: 'T',
      caption: null as unknown as string,
      question: '',
      code: { code: '', language: 'cpp' },
      outputOptions: ['X'],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { caption?: string }).caption).toBeUndefined();
    expect((result as unknown as { code: { code: string; language: string } }).code.code).toBe('std::cout << "Hello";');
    expect((result as unknown as { code: { code: string; language: string } }).code.language).toBe('cpp');
  });

  it('should use provided outputOptions when non-empty for code-trace', () => {
    const draft: import('../../types').CodeTraceCardDraft = {
      kind: 'code-trace',
      title: 'T',
      caption: 'C',
      question: 'Q?',
      code: { code: 'x = 1', language: 'typescript' },
      outputOptions: ['1', '2', '3'],
      correctIndex: 1,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { outputOptions: string[] }).outputOptions).toEqual(['1', '2', '3']);
  });

  it('should use fallback timeLimitSec when 0 for timed', () => {
    const draft: TimedCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'timed',
      title: 'T',
      direction: undefined as unknown as 'known-to-learning' | 'learning-to-known',
      promptKnown: '',
      optionsLearning: [],
      optionsLexemes: [],
      correctIndex: 0,
      timeLimitSec: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { timeLimitSec: number }).timeLimitSec).toBe(30);
  });

  it('should use provided direction when defined for sound', () => {
    const draft: SoundCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'sound',
      title: 'T',
      direction: 'learning-to-known',
      promptKnown: 'P',
      audioLabelLearning: 'AL',
      audioLabelLexeme: emptyLexemeDraftFields(),
      optionsKnown: [],
      optionsLexemes: [],
      correctIndex: 0,
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { direction: string }).direction).toBe('learning-to-known');
  });

  it('should use provided practiceMode when defined for draw', () => {
    const draft: DrawCardDraft = {
      ...emptyLexemeCardDraft(),
      kind: 'draw',
      title: 'T',
      promptKnown: 'P',
      referenceHintKnown: 'RH',
      practiceMode: 'tracing',
      targetCharacter: '水',
      radicalHint: '犭',
      strokeGuides: [],
      appearance,
    };
    const result = fallbackPreviewCard(draft, 'p');
    expect((result as unknown as { practiceMode?: string }).practiceMode).toBe('tracing');
    expect((result as unknown as { radicalHint?: string }).radicalHint).toBe('犭');
  });
});
