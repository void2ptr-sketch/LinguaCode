import {
  normalizeCardDraft,
  normalizeCodeSelectCardDraft,
  normalizeDrawCardDraft,
  normalizeKeyboardCardDraft,
  normalizeMemoryCardDraft,
  normalizeReadingCardDraft,
  normalizeSelectCardDraft,
  normalizeSoundCardDraft,
  normalizeTimedCardDraft,
  cardValidationErrorMessage,
} from './card-validation.utils';
import type { CardKind } from '../../../../entities/card/model';
import { emptyLexemeCardDraft, emptyMemoryPairDraft, emptyOptionLexemes } from '../../types';
import { emptyLexemeDraftFields } from '../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';

describe('card-validation.utils', () => {
  const appearance = { theme: 'azure-blue', fontSize: 'md' as const };
  const lexemeDraft = emptyLexemeCardDraft();

  it('should normalize valid select card draft', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['Answer A', 'Answer B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card?.kind).toBe('select');
    expect(card?.title).toBe('Тест');
  });

  it('should normalize valid code-select card draft', () => {
    const card = normalizeCodeSelectCardDraft(
      {
        kind: 'code-select',
        title: 'Perl snippet',
        caption: 'Что выведет код?',
        prompt: { language: 'perl', code: 'print 1;' },
        options: [
          { language: 'perl', code: '1' },
          { language: 'perl', code: '0' },
        ],
        correctIndex: 0,
        appearance,
      },
      'code-1',
    );

    expect(card?.kind).toBe('code-select');
    expect(card?.prompt.code).toBe('print 1;');
    expect(card?.options.length).toBe(2);
  });

  it('should preserve prompt lexeme in select card', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Китайский',
        direction: 'known-to-learning',
        promptKnown: 'Привет',
        optionsLearning: ['你好', '谢谢'],
        optionsKnown: ['Hello', 'Thank you'],
        optionsLexemes: [
          {
            primary: '你好',
            script: 'hani',
            pinyin: 'nǐ hǎo',
            zhuyin: '',
            palladius: 'ни хао',
            ipa: '',
            audioUrl: '',
            acceptedReadings: '',
          },
          emptyLexemeDraftFields('hani'),
        ],
        correctIndex: 0,
        appearance,
        promptLexeme: {
          primary: '你好',
          script: 'hani',
          pinyin: 'nǐ hǎo',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
          acceptedReadings: '',
        },
        audioUrl: '',
      },
      'card-zh',
    );

    expect(card?.promptLexeme?.primary).toBe('你好');
    expect(card?.optionsLexemes?.[0]?.palladius).toBe('ни хао');
  });

  it('should normalize memory card draft', () => {
    const pair = { ...emptyMemoryPairDraft(), known: 'A', learning: 'B' };
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: 'Пары',
        promptKnown: 'Найдите пары',
        pairs: [pair],
        appearance,
        ...lexemeDraft,
      },
      'memory-1',
    );

    expect(card?.kind).toBe('memory');
    expect(card?.pairs.length).toBe(1);
  });

  it('should normalize keyboard card draft', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Ввод',
        direction: 'known-to-learning',
        promptKnown: 'Введите ответ',
        acceptedAnswersKnown: ['hello'],
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card?.acceptedAnswersKnown).toEqual(['hello']);
  });

  it('should reject timed card with short limit', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 2,
        appearance,
        ...lexemeDraft,
      },
      'timed-1',
    );

    expect(card).toBeNull();
  });

  it('should reject timed card with long limit', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 700,
        appearance,
        ...lexemeDraft,
      },
      'timed-1',
    );

    expect(card).toBeNull();
  });

  it('should accept timed card with valid limit', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 60,
        appearance,
        ...lexemeDraft,
      },
      'timed-1',
    );

    expect(card?.kind).toBe('timed');
    expect(card?.timeLimitSec).toBe(60);
  });

  it('should round time limit to nearest integer', () => {
    const card = normalizeTimedCardDraft(
      {
        kind: 'timed',
        title: 'Timer',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 59.6,
        appearance,
        ...lexemeDraft,
      },
      'timed-1',
    );

    expect(card?.timeLimitSec).toBe(60);
  });

  // ── Select Card rejection cases ──

  it('should reject select card with missing title', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card).toBeNull();
  });

  it('should reject select card with invalid correct index', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 5,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card).toBeNull();
  });

  it('should reject select card with too few options', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A'],
        optionsKnown: ['A'],
        optionsLexemes: emptyOptionLexemes(1),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card).toBeNull();
  });

  it('should reject select card with too many options', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Тест',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        optionsKnown: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        optionsLexemes: emptyOptionLexemes(9),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card).toBeNull();
  });

  // ── Code-Select Card rejection cases ──

  it('should reject code-select with missing title', () => {
    const card = normalizeCodeSelectCardDraft(
      {
        kind: 'code-select',
        title: '',
        caption: 'Caption',
        prompt: { language: 'perl', code: 'print 1;' },
        options: [
          { language: 'perl', code: '1' },
          { language: 'perl', code: '0' },
        ],
        correctIndex: 0,
        appearance,
      },
      'code-1',
    );

    expect(card).toBeNull();
  });

  it('should reject code-select with invalid correct index', () => {
    const card = normalizeCodeSelectCardDraft(
      {
        kind: 'code-select',
        title: 'Test',
        caption: 'Caption',
        prompt: { language: 'perl', code: 'print 1;' },
        options: [
          { language: 'perl', code: '1' },
          { language: 'perl', code: '0' },
        ],
        correctIndex: 5,
        appearance,
      },
      'code-1',
    );

    expect(card).toBeNull();
  });

  it('should reject code-select with too few code blocks', () => {
    const card = normalizeCodeSelectCardDraft(
      {
        kind: 'code-select',
        title: 'Test',
        caption: 'Caption',
        prompt: { language: 'perl', code: 'print 1;' },
        options: [{ language: 'perl', code: '1' }],
        correctIndex: 0,
        appearance,
      },
      'code-1',
    );

    expect(card).toBeNull();
  });

  it('should reject code-select with empty code block', () => {
    const card = normalizeCodeSelectCardDraft(
      {
        kind: 'code-select',
        title: 'Test',
        caption: 'Caption',
        prompt: { language: 'perl', code: 'print 1;' },
        options: [
          { language: 'perl', code: '' },
          { language: 'perl', code: '0' },
        ],
        correctIndex: 0,
        appearance,
      },
      'code-1',
    );

    expect(card).toBeNull();
  });

  // ── Memory Card rejection cases ──

  it('should reject memory card with missing title', () => {
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: '',
        promptKnown: 'Найдите пары',
        pairs: [{ ...emptyMemoryPairDraft(), known: 'A', learning: 'B' }],
        appearance,
        ...lexemeDraft,
      },
      'memory-1',
    );

    expect(card).toBeNull();
  });

  it('should reject memory card with too few pairs', () => {
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: 'Test',
        promptKnown: 'Pairs',
        pairs: [],
        appearance,
        ...lexemeDraft,
      },
      'memory-1',
    );

    expect(card).toBeNull();
  });

  it('should filter out empty pairs in memory card', () => {
    const card = normalizeMemoryCardDraft(
      {
        kind: 'memory',
        title: 'Test',
        promptKnown: 'Pairs',
        pairs: [
          { ...emptyMemoryPairDraft(), known: 'A', learning: 'B' },
          { ...emptyMemoryPairDraft(), known: '', learning: 'X' },
        ],
        appearance,
        ...lexemeDraft,
      },
      'memory-1',
    );

    expect(card?.pairs.length).toBe(1);
  });

  // ── Keyboard Card rejection cases ──

  it('should reject keyboard card with missing title', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Введите ответ',
        acceptedAnswersKnown: ['hello'],
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card).toBeNull();
  });

  it('should accept keyboard card with minimum answers (1)', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Answer',
        acceptedAnswersKnown: ['hello'],
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card?.acceptedAnswersKnown).toEqual(['hello']);
  });

  it('should reject keyboard card with too many answers', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Answer',
        acceptedAnswersKnown: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card).toBeNull();
  });

  it('should preserve non-auto answerMode in keyboard card', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Answer',
        acceptedAnswersKnown: ['hello', 'world'],
        answerMode: 'pinyin',
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card?.answerMode).toBe('pinyin');
  });

  it('should not include answerMode when it is auto', () => {
    const card = normalizeKeyboardCardDraft(
      {
        kind: 'keyboard',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Answer',
        acceptedAnswersKnown: ['hello', 'world'],
        answerMode: 'auto',
        appearance,
        ...lexemeDraft,
      },
      'keyboard-1',
    );

    expect(card?.answerMode).toBeUndefined();
  });

  // ── normalizeCardDraft dispatcher ──

  it('should route to correct normalizer based on kind', () => {
    const card = normalizeCardDraft(
      {
        kind: 'select',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card?.kind).toBe('select');
  });

  it('should return null for invalid select draft via dispatcher', () => {
    const card = normalizeCardDraft(
      {
        kind: 'select',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'card-1',
    );

    expect(card).toBeNull();
  });

  // ── cardValidationErrorMessage ──

  it('should return error message for each card kind', () => {
    const kinds: CardKind[] = [
      'memory',
      'keyboard',
      'draw',
      'timed',
      'sound',
      'symbol',
      'select',
      'code-select',
      'reading',
      'tone',
    ];

    kinds.forEach((kind) => {
      const message = cardValidationErrorMessage(kind);
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  it('should return specific message for memory card', () => {
    expect(cardValidationErrorMessage('memory')).toBe(
      'Проверьте название, подсказку и пары (минимум одна пара)',
    );
  });

  it('should return specific message for timed card', () => {
    expect(cardValidationErrorMessage('timed')).toContain('5–600 сек');
  });

  // ── Edge cases ──

  it('should handle courseId/lessonId/scenarioId as undefined when falsy', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
        courseId: undefined,
        lessonId: undefined,
        scenarioId: '',
      },
      'card-1',
    );

    expect(card?.courseId).toBeUndefined();
    expect(card?.lessonId).toBeUndefined();
    expect(card?.scenarioId).toBeUndefined();
  });

  it('should include courseId/lessonId/scenarioId when provided', () => {
    const card = normalizeSelectCardDraft(
      {
        kind: 'select',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
      },
      'card-1',
    );

    expect(card?.courseId).toBe('course-1');
    expect(card?.lessonId).toBe('lesson-1');
    expect(card?.scenarioId).toBe('scenario-1');
  });

  // ── Draw Card ──

  it('should normalize valid draw card draft', () => {
    const card = normalizeDrawCardDraft(
      {
        kind: 'draw',
        title: 'Draw',
        promptKnown: 'Draw it',
        targetCharacter: '水',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        appearance,
        ...lexemeDraft,
      },
      'draw-1',
    );

    expect(card?.kind).toBe('draw');
    expect(card?.targetCharacter).toBe('水');
  });

  it('should reject draw card with missing title', () => {
    const card = normalizeDrawCardDraft(
      {
        kind: 'draw',
        title: '',
        promptKnown: 'Draw it',
        targetCharacter: '水',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        appearance,
        ...lexemeDraft,
      },
      'draw-1',
    );

    expect(card).toBeNull();
  });

  it('should accept draw card without character target', () => {
    const card = normalizeDrawCardDraft(
      {
        kind: 'draw',
        title: 'Test',
        promptKnown: 'Draw it',
        targetCharacter: '',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        appearance,
        ...lexemeDraft,
      },
      'draw-1',
    );

    expect(card?.kind).toBe('draw');
  });

  it('should normalize draw card with character targets', () => {
    const card = normalizeDrawCardDraft(
      {
        kind: 'draw',
        title: 'Multi',
        promptKnown: 'Draw',
        targetCharacter: '水',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        characterTargets: [
          { character: '水', pinyin: 'shui' },
          { character: '火', pinyin: 'huo' },
        ],
        appearance,
        ...lexemeDraft,
      },
      'draw-1',
    );

    expect(card?.kind).toBe('draw');
    expect(card?.characterTargets).toHaveLength(2);
  });

  it('should normalize draw card with hints practice mode', () => {
    const card = normalizeDrawCardDraft(
      {
        kind: 'draw',
        title: 'Hints',
        promptKnown: 'Draw with hints',
        targetCharacter: '大',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        practiceMode: 'hints',
        appearance,
        ...lexemeDraft,
      },
      'draw-1',
    );

    expect(card?.practiceMode).toBe('hints');
  });

  // ── Sound Card ──

  it('should normalize valid sound card draft', () => {
    const card = normalizeSoundCardDraft(
      {
        kind: 'sound',
        title: 'Sound',
        direction: 'known-to-learning',
        promptKnown: 'Listen',
        audioLabelLearning: 'play',
        audioLabelLexeme: emptyLexemeDraftFields('hani'),
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'sound-1',
    );

    expect(card?.kind).toBe('sound');
  });

  it('should reject sound card with missing title', () => {
    const card = normalizeSoundCardDraft(
      {
        kind: 'sound',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Listen',
        audioLabelLearning: 'play',
        audioLabelLexeme: emptyLexemeDraftFields('hani'),
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'sound-1',
    );

    expect(card).toBeNull();
  });

  it('should reject sound card with too few options', () => {
    const card = normalizeSoundCardDraft(
      {
        kind: 'sound',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Listen',
        audioLabelLearning: 'play',
        audioLabelLexeme: emptyLexemeDraftFields('hani'),
        optionsKnown: ['A'],
        optionsLexemes: emptyOptionLexemes(1),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'sound-1',
    );

    expect(card).toBeNull();
  });

  // ── Reading Card ──

  it('should normalize valid reading card draft', () => {
    const card = normalizeReadingCardDraft(
      {
        kind: 'reading',
        title: 'Reading',
        direction: 'known-to-learning',
        promptKnown: 'Read this',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'reading-1',
    );

    expect(card?.kind).toBe('reading');
  });

  it('should reject reading card with missing title', () => {
    const card = normalizeReadingCardDraft(
      {
        kind: 'reading',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Read',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'reading-1',
    );

    expect(card).toBeNull();
  });

  it('should reject reading card with too few options', () => {
    const card = normalizeReadingCardDraft(
      {
        kind: 'reading',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Read',
        optionsLearning: ['A'],
        optionsLexemes: emptyOptionLexemes(1),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'reading-1',
    );

    expect(card).toBeNull();
  });

  it('should reject reading card with invalid correct index', () => {
    const card = normalizeReadingCardDraft(
      {
        kind: 'reading',
        title: 'Test',
        direction: 'known-to-learning',
        promptKnown: 'Read',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 5,
        appearance,
        ...lexemeDraft,
      },
      'reading-1',
    );

    expect(card).toBeNull();
  });

  // ── Dispatcher for all kinds ──

  it('should route draw kind to draw normalizer', () => {
    const card = normalizeCardDraft(
      {
        kind: 'draw',
        title: 'Draw',
        promptKnown: 'Draw it',
        targetCharacter: '一',
        referenceHintKnown: '参考提示',
        radicalHint: '',
        strokeGuides: [],
        practiceMode: 'freehand',
        appearance,
        ...lexemeDraft,
      },
      'draw-dispatch',
    );

    expect(card?.kind).toBe('draw');
  });

  it('should route sound kind to sound normalizer', () => {
    const card = normalizeCardDraft(
      {
        kind: 'sound',
        title: 'Sound',
        direction: 'known-to-learning',
        promptKnown: 'Listen',
        audioLabelLearning: 'play',
        audioLabelLexeme: emptyLexemeDraftFields('hani'),
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'sound-dispatch',
    );

    expect(card?.kind).toBe('sound');
  });

  it('should route reading kind to reading normalizer', () => {
    const card = normalizeCardDraft(
      {
        kind: 'reading',
        title: 'Reading',
        direction: 'known-to-learning',
        promptKnown: 'Read',
        optionsLearning: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'reading-dispatch',
    );

    expect(card?.kind).toBe('reading');
  });

  // ── new kinds: flip, cloze, code-trace ──

  it('should normalize a flip draft', () => {
    const card = normalizeCardDraft(
      {
        kind: 'flip',
        title: 'Flip',
        front: 'Привет',
        back: 'Hello',
        audioUrl: '',
        appearance,
      },
      'flip-1',
    );

    expect(card).toMatchObject({ kind: 'flip', front: 'Привет', back: 'Hello' });
    expect(card?.appearance).toEqual(appearance);
  });

  it('should return null for invalid flip draft', () => {
    const card = normalizeCardDraft(
      {
        kind: 'flip',
        title: '',
        front: 'Привет',
        back: 'Hello',
        audioUrl: '',
        appearance,
      },
      'flip-empty',
    );

    expect(card).toBeNull();
  });

  it('should normalize a cloze draft in select mode', () => {
    const card = normalizeCardDraft(
      {
        kind: 'cloze',
        title: 'Cloze',
        promptKnown: 'I ___ coffee.',
        options: ['drinks', 'drink'],
        acceptedAnswers: [],
        correctAnswer: 'drink',
        correctIndex: 1,
        appearance,
        ...lexemeDraft,
      },
      'cloze-select',
    );

    expect(card).toMatchObject({
      kind: 'cloze',
      options: ['drinks', 'drink'],
      correctIndex: 1,
      correctAnswer: 'drink',
    });
  });

  it('should normalize a cloze draft in input mode', () => {
    const card = normalizeCardDraft(
      {
        kind: 'cloze',
        title: 'Cloze',
        promptKnown: 'Five + five = ___',
        options: [],
        acceptedAnswers: ['10'],
        correctAnswer: 'ten',
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'cloze-input',
    );

    expect(card).toMatchObject({
      kind: 'cloze',
      acceptedAnswers: ['10'],
      correctAnswer: 'ten',
    });
    expect('options' in (card ?? {})).toBe(false);
  });

  it('should return null for cloze draft without correct answer', () => {
    const card = normalizeCardDraft(
      {
        kind: 'cloze',
        title: 'Cloze',
        promptKnown: 'I ___ coffee.',
        options: [],
        acceptedAnswers: [],
        correctAnswer: '',
        correctIndex: 0,
        appearance,
        ...lexemeDraft,
      },
      'cloze-invalid',
    );

    expect(card).toBeNull();
  });

  it('should normalize a code-trace draft', () => {
    const card = normalizeCardDraft(
      {
        kind: 'code-trace',
        title: 'Trace',
        caption: '',
        question: 'Что выведет?',
        code: { code: 'int main() {}', language: 'cpp' },
        outputOptions: ['0', '1'],
        correctIndex: 0,
        appearance,
      },
      'trace-1',
    );

    expect(card).toMatchObject({
      kind: 'code-trace',
      outputOptions: ['0', '1'],
      correctIndex: 0,
    });
  });

  it('should return null for code-trace draft with empty options', () => {
    const card = normalizeCardDraft(
      {
        kind: 'code-trace',
        title: 'Trace',
        caption: '',
        question: '',
        code: { code: 'int main() {}', language: 'cpp' },
        outputOptions: [],
        correctIndex: 0,
        appearance,
      },
      'trace-invalid',
    );

    expect(card).toBeNull();
  });
});
