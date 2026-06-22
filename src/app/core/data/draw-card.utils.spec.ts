import type { DrawCard } from '../models';
import {
  containsHanScript,
  drawCharacterTabLabel,
  extractKnownLanguageFromTitle,
  resolveDrawCharacterTargets,
  resolveDrawMeaning,
  resolveDrawQuestion,
  splitPinyinSyllables,
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

  it('should derive character targets from primary han string', () => {
    const targets = resolveDrawCharacterTargets(baseDrawCard);
    expect(targets).toHaveSize(2);
    expect(targets[0].character).toBe('你');
    expect(targets[0].pinyin).toBe('nǐ');
    expect(targets[1].character).toBe('好');
    expect(targets[1].pinyin).toBe('hǎo');
  });

  it('should build tab label with pinyin only (no han character hint)', () => {
    expect(drawCharacterTabLabel({ character: '你', pinyin: 'nǐ' })).toBe('nǐ');
    expect(drawCharacterTabLabel({ character: '你' }, 0)).toBe('1');
  });
});
