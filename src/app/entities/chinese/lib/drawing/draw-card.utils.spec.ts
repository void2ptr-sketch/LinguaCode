import type { DrawCard } from '../../../card/model';
import {
  buildDrawPhoneticsLexeme,
  buildDrawTabLexeme,
  containsHanScript,
  drawCharacterTabLabel,
  drawCharacterTabPinyinLabel,
  extractKnownLanguageFromTitle,
  mergeDrawCardQuestionFields,
  parseRadicalHintParts,
  resolveDrawAudioUrl,
  resolveDrawCharacterTargets,
  resolveDrawLearningSpeechText,
  resolveDrawMeaning,
  resolveDrawPromptLexeme,
  resolveDrawQuestion,
  resolveInitialDrawCanvasMode,
  splitPinyinSyllables,
  stripHanScript,
} from './draw-card.utils';

describe('draw-card.utils', () => {
  const baseDrawCard: DrawCard = {
    id: 'draw-1',
    kind: 'draw',
    title: 'Test',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Нарисуйте иероглиф',
    referenceHintKnown: 'Привет',
    targetCharacter: '你好',
    promptLexeme: {
      primary: '你好',
      script: 'hani',
      pinyin: 'nǐ hǎo',
    },
  };

  it('should split pinyin by syllable count', () => {
    expect(splitPinyinSyllables('nǐ hǎo', 2)).toEqual(['nǐ', 'hǎo']);
    expect(splitPinyinSyllables('rén', 1)).toEqual(['rén']);
  });

  it('should resolve meaning from reference hint without han script', () => {
    expect(resolveDrawMeaning({ ...baseDrawCard, meaningKnown: 'человек' })).toBe('человек');
    expect(resolveDrawMeaning(baseDrawCard)).toBe('Привет');
  });

  it('should not use promptKnown or han-only fields as question text', () => {
    expect(
      resolveDrawQuestion({
        ...baseDrawCard,
        title: '你好',
        meaningKnown: '将恩深房',
        referenceHintKnown: '将恩深房',
        promptKnown: 'Нарисуйте «你好»',
      }),
    ).toBe('');
    expect(stripHanScript('Иероглиф 人')).toBe('Иероглиф');
    expect(containsHanScript('你好')).toBe(true);
    expect(containsHanScript('Музей')).toBe(false);
  });

  it('should resolve draw-henbang question as Отлично', () => {
    const henbangCard: DrawCard = {
      id: 'draw-henbang-1',
      kind: 'draw',
      title: '很棒 — отлично',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptKnown: 'Нарисуйте «很棒»',
      referenceHintKnown: 'Отлично',
      meaningKnown: 'Отлично',
      targetCharacter: '很棒',
    };

    expect(resolveDrawQuestion(henbangCard)).toBe('Отлично');
  });

  it('should fall back to known-language part of title', () => {
    expect(extractKnownLanguageFromTitle('很棒 — отлично')).toBe('отлично');
    expect(extractKnownLanguageFromTitle('博物馆 — музей')).toBe('музей');
    expect(
      resolveDrawQuestion({
        ...baseDrawCard,
        title: '很棒 — отлично',
        meaningKnown: undefined,
        referenceHintKnown: '很棒',
      }),
    ).toBe('отлично');
  });

  it('should resolve learning speech text from draw card', () => {
    expect(
      resolveDrawLearningSpeechText({
        ...baseDrawCard,
        targetCharacter: '很棒',
      }),
    ).toBe('很棒');
    expect(resolveDrawLearningSpeechText(baseDrawCard, { character: '好', pinyin: 'hǎo' })).toBe(
      '好',
    );
  });

  it('should parse radical hint into components with positional index', () => {
    expect(parseRadicalHintParts('女 + 子')).toEqual([
      { character: '女', componentIndex: 0 },
      { character: '子', componentIndex: 1 },
    ]);
    expect(parseRadicalHintParts('氵+可')).toEqual([
      { character: '氵', componentIndex: 0 },
      { character: '可', componentIndex: 1 },
    ]);
    expect(parseRadicalHintParts('女(nǚ) + 子(zi3)')).toEqual([
      { character: '女', componentIndex: 0 },
      { character: '子', componentIndex: 1 },
    ]);
    expect(parseRadicalHintParts('')).toEqual([]);
  });

  it('should derive character targets from primary han string', () => {
    const targets = resolveDrawCharacterTargets(baseDrawCard);
    expect(targets).toHaveLength(2);
    expect(targets[0].character).toBe('你');
    expect(targets[0].pinyin).toBe('nǐ');
    expect(targets[1].character).toBe('好');
    expect(targets[1].pinyin).toBe('hǎo');
  });

  it('should build tab label with pinyin only (no han character hint)', () => {
    expect(drawCharacterTabPinyinLabel({ character: '你', pinyin: 'nǐ' })).toBe('nǐ');
    expect(drawCharacterTabPinyinLabel({ character: '你', zhuyin: 'ㄋㄧˇ' }, 0)).toBe('1');
    expect(drawCharacterTabLabel({ character: '你', pinyin: 'nǐ' })).toBe('nǐ');
    expect(drawCharacterTabLabel({ character: '你' }, 0)).toBe('1');
  });

  it('should split palladius across character targets', () => {
    const targets = resolveDrawCharacterTargets({
      ...baseDrawCard,
      promptLexeme: {
        ...baseDrawCard.promptLexeme!,
        palladius: 'ни хао',
      },
    });

    expect(targets[0].palladius).toBe('ни');
    expect(targets[1].palladius).toBe('хао');
  });

  it('should always open draw canvas on memory mode', () => {
    expect(resolveInitialDrawCanvasMode()).toBe('memory');
  });

  it('should build tab lexeme for draw card phonetics without han', () => {
    const lexeme = buildDrawTabLexeme(
      { character: '你', pinyin: 'nǐ' },
      {
        ...baseDrawCard,
        promptLexeme: {
          ...baseDrawCard.promptLexeme!,
          ipa: 'ni˨˩˦',
        },
      },
      0,
    );

    expect(lexeme.primary).toBe('');
    expect(lexeme.script).toBe('latn');
    expect(lexeme.pinyin).toBe('nǐ');
    expect(lexeme.ipa).toBe('ni˨˩˦');
  });

  // ── Additional uncovered branches ──

  it('should return empty array when pinyin split count is zero', () => {
    expect(splitPinyinSyllables('nǐ hǎo', 0)).toEqual([]);
    expect(splitPinyinSyllables('nǐ hǎo', -1)).toEqual([]);
  });

  it('should return undefined array when pinyin is empty', () => {
    expect(splitPinyinSyllables('', 3)).toEqual([undefined, undefined, undefined]);
    expect(splitPinyinSyllables(undefined, 2)).toEqual([undefined, undefined]);
    expect(splitPinyinSyllables('   ', 2)).toEqual([undefined, undefined]);
  });

  it('should fallback to last syllable when parts count differs', () => {
    expect(splitPinyinSyllables('nǐ', 3)).toEqual(['nǐ', 'nǐ', 'nǐ']);
    expect(splitPinyinSyllables('nǐ hǎo', 3)).toEqual(['nǐ', 'hǎo', 'hǎo']);
  });

  it('should parse empty radical hint as empty array', () => {
    expect(parseRadicalHintParts('   ')).toEqual([]);
  });

  it('should parse single segment without plus', () => {
    expect(parseRadicalHintParts('女')).toEqual([{ character: '女', componentIndex: 0 }]);
  });

  it('should extract known language from title without han script', () => {
    expect(extractKnownLanguageFromTitle('hello world')).toBe('hello world');
    expect(extractKnownLanguageFromTitle(undefined)).toBe('');
    expect(extractKnownLanguageFromTitle('')).toBe('');
  });

  it('should extract known language from title with han script before dash', () => {
    // The function looks at the part AFTER the dash; 'привет' has no han script
    expect(extractKnownLanguageFromTitle('你好 — привет')).toBe('привет');
  });

  it('should resolve draw audio url from target', () => {
    const card: DrawCard = {
      ...baseDrawCard,
      promptLexeme: {
        ...baseDrawCard.promptLexeme!,
        audioUrl: 'card-audio.mp3',
      },
    };

    expect(resolveDrawAudioUrl(card, { character: '你', audioUrl: 'target-audio.mp3' })).toBe(
      'target-audio.mp3',
    );
    expect(resolveDrawAudioUrl(card)).toBe('card-audio.mp3');
  });

  it('should resolve draw audio url as null when no audio available', () => {
    const card: DrawCard = {
      ...baseDrawCard,
      promptLexeme: {
        ...baseDrawCard.promptLexeme!,
        audioUrl: '',
      },
    };

    expect(resolveDrawAudioUrl(card)).toBeNull();
  });

  it('should resolve learning speech text from promptLexeme when no target', () => {
    expect(
      resolveDrawLearningSpeechText({
        ...baseDrawCard,
        targetCharacter: '',
      }),
    ).toBe('你好');
  });

  it('should resolve character targets with empty primary', () => {
    const targets = resolveDrawCharacterTargets({
      ...baseDrawCard,
      targetCharacter: '',
      promptLexeme: {
        ...baseDrawCard.promptLexeme!,
        primary: '',
      },
    });

    expect(targets).toHaveLength(1);
    expect(targets[0].character).toBe('');
  });

  it('should use character targets when provided', () => {
    const targets = resolveDrawCharacterTargets({
      ...baseDrawCard,
      characterTargets: [
        { character: '你', pinyin: 'nǐ' },
        { character: '好', pinyin: 'hǎo' },
      ],
    });

    expect(targets).toHaveLength(2);
    expect(targets[0].character).toBe('你');
    expect(targets[1].character).toBe('好');
  });

  it('should return index as tab label when no phonetics available', () => {
    expect(drawCharacterTabPinyinLabel({ character: '你' }, 5)).toBe('6');
  });

  it('should return zhuyin as tab label when no pinyin', () => {
    expect(drawCharacterTabLabel({ character: '你', zhuyin: 'ㄋㄧˇ' })).toBe('ㄋㄧˇ');
  });

  it('should return palladius as tab label when no pinyin or zhuyin', () => {
    expect(drawCharacterTabLabel({ character: '你', palladius: 'ни' })).toBe('ни');
  });

  it('should build draw phonetics lexeme with ipa option', () => {
    const lexeme = buildDrawPhoneticsLexeme(
      { primary: '你好', script: 'hani' as const, pinyin: 'nǐ hǎo', ipa: 'ni˨˩˦' },
      { ipa: [{ transcription: 'ni˨˩˦' }] },
    );

    expect(lexeme.pinyin).toBe('nǐ hǎo');
    expect(lexeme.ipa).toEqual([{ transcription: 'ni˨˩˦' }]);
  });

  it('should resolve draw prompt lexeme as null when no phonetics', () => {
    const card: DrawCard = {
      ...baseDrawCard,
      promptLexeme: {
        primary: '你好',
        script: 'hani' as const,
        pinyin: '',
        zhuyin: '',
        palladius: '',
        ipa: undefined,
      },
    };

    expect(resolveDrawPromptLexeme(card)).toBeNull();
  });

  it('should merge draw card question fields when stored is empty', () => {
    const stored: DrawCard = {
      ...baseDrawCard,
      meaningKnown: '',
      referenceHintKnown: '',
      title: '',
      promptLexeme: {
        primary: '',
        script: 'hani' as const,
        pinyin: '',
      },
    };

    const seed: DrawCard = {
      ...baseDrawCard,
      title: 'Seed title',
      meaningKnown: 'seed meaning',
      referenceHintKnown: 'seed hint',
      promptLexeme: {
        primary: 'seed',
        script: 'hani' as const,
        pinyin: 'seed',
      },
    };

    const merged = mergeDrawCardQuestionFields(stored, seed);
    expect(merged.title).toBe('Seed title');
    expect(merged.meaningKnown).toBe('seed meaning');
  });

  it('should not merge draw card question fields when stored already has question', () => {
    const stored: DrawCard = {
      ...baseDrawCard,
      meaningKnown: 'existing meaning',
    };

    const seed: DrawCard = {
      ...baseDrawCard,
      title: 'Seed title',
      meaningKnown: 'seed meaning',
    };

    const merged = mergeDrawCardQuestionFields(stored, seed);
    expect(merged.meaningKnown).toBe('existing meaning');
  });

  it('should build tab lexeme without ipa for non-first character', () => {
    const lexeme = buildDrawTabLexeme(
      { character: '好', pinyin: 'hǎo' },
      {
        ...baseDrawCard,
        promptLexeme: {
          ...baseDrawCard.promptLexeme!,
          ipa: 'ni˨˩˦',
        },
      },
      1,
    );

    expect(lexeme.ipa).toBeUndefined();
  });
});
