import type { DrawCard } from '../models';
import type { DrawCanvasMode, DrawCharacterTarget } from '../models/draw-practice.types';
import type { PhoneticLexeme } from '../models/phonetic-content.types';

export type RadicalHintPart = {
  readonly character: string;
  /** Порядковый номер компонента в разложении (0…3) — для цвета, не тон слога. */
  readonly componentIndex: number;
};

export function splitPinyinSyllables(
  pinyin: string | undefined,
  count: number,
): readonly (string | undefined)[] {
  if (count <= 0) {
    return [];
  }

  if (!pinyin?.trim()) {
    return Array.from({ length: count }, () => undefined);
  }

  const parts = pinyin.trim().split(/\s+/);
  if (parts.length === count) {
    return parts;
  }

  if (count === 1) {
    return [pinyin.trim()];
  }

  return Array.from({ length: count }, (_, index) => parts[index] ?? parts[parts.length - 1]);
}

const HAN_SCRIPT_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/gu;
const HAN_CHARACTER_RE = /^[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]$/u;

export function isHanCharacter(char: string): boolean {
  return HAN_CHARACTER_RE.test(char);
}

/** Разбирает сегмент «女(nǚ)» или «女». */
function parseRadicalHintSegment(segment: string): string | null {
  const trimmed = segment.trim();
  if (!trimmed) {
    return null;
  }

  const withoutPinyin = trimmed.replace(/\s*\([^)]*\)\s*/u, '').trim();
  return [...withoutPinyin].find((char) => isHanCharacter(char)) ?? null;
}

/** Разбирает подсказку «女 + 子» на компоненты с индексом для раскраски. */
export function parseRadicalHintParts(hint: string): readonly RadicalHintPart[] {
  const trimmed = hint.trim();
  if (!trimmed) {
    return [];
  }

  const segments = trimmed.includes('+') ? trimmed.split('+') : [trimmed];

  return segments
    .map((segment) => parseRadicalHintSegment(segment))
    .filter((character): character is string => Boolean(character))
    .map((character, componentIndex) => ({
      character,
      componentIndex,
    }));
}

export function containsHanScript(text: string): boolean {
  return HAN_SCRIPT_RE.test(text);
}

/** Часть title после « — » / « - », если там нет иероглифов (напр. «很棒 — отлично» → «отлично»). */
export function extractKnownLanguageFromTitle(title: string | undefined): string {
  const trimmed = title?.trim();
  if (!trimmed) {
    return '';
  }

  const dashParts = trimmed.split(/\s*[—–-]\s*/);
  if (dashParts.length >= 2) {
    const knownPart = dashParts.slice(1).join(' — ').trim();
    if (knownPart && !containsHanScript(knownPart)) {
      return knownPart;
    }
  }

  if (!containsHanScript(trimmed)) {
    return trimmed;
  }

  return '';
}

/** Удаляет иероглифы из строки (подсказки, заголовки с «人» и т.п.). */
export function stripHanScript(text: string): string {
  return text.replace(HAN_SCRIPT_RE, '').replace(/\s+/g, ' ').trim();
}

/** Текст вопроса на известном языке — без иероглифов и без promptKnown. */
export function resolveDrawQuestion(card: DrawCard): string {
  const candidates = [
    card.meaningKnown?.trim(),
    card.promptLexeme?.glossKnown?.trim(),
    card.referenceHintKnown?.trim(),
    extractKnownLanguageFromTitle(card.title),
  ].filter((value): value is string => Boolean(value?.length));

  for (const text of candidates) {
    const cleaned = stripHanScript(text);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
}

export function resolveDrawMeaning(card: DrawCard): string {
  return resolveDrawQuestion(card);
}

export function mergeDrawCardQuestionFields(stored: DrawCard, seed: DrawCard): DrawCard {
  if (resolveDrawQuestion(stored)) {
    return stored;
  }

  return {
    ...stored,
    title: seed.title,
    ...(seed.meaningKnown ? { meaningKnown: seed.meaningKnown } : {}),
    ...(seed.referenceHintKnown ? { referenceHintKnown: seed.referenceHintKnown } : {}),
    ...(seed.promptLexeme
      ? {
          promptLexeme: {
            ...stored.promptLexeme,
            ...seed.promptLexeme,
          },
        }
      : {}),
  };
}

export function resolveDrawAudioUrl(card: DrawCard, target?: DrawCharacterTarget): string | null {
  const fromTarget = target?.audioUrl?.trim();
  if (fromTarget) {
    return fromTarget;
  }

  const fromCard = card.audioUrl?.trim();
  if (fromCard) {
    return fromCard;
  }

  return card.promptLexeme?.audioUrl?.trim() || null;
}

/** Текст слова на изучаемом языке для озвучки (иероглиф / слово). */
export function resolveDrawLearningSpeechText(
  card: DrawCard,
  target?: DrawCharacterTarget,
): string {
  const fromTarget = target?.character?.trim();
  if (fromTarget) {
    return fromTarget;
  }

  return card.targetCharacter?.trim() || card.promptLexeme?.primary?.trim() || '';
}

export function resolveDrawCharacterTargets(card: DrawCard): readonly DrawCharacterTarget[] {
  if (card.characterTargets?.length) {
    return card.characterTargets;
  }

  const primary = card.targetCharacter?.trim() || card.promptLexeme?.primary?.trim() || '';
  const meaning = card.meaningKnown?.trim() || card.referenceHintKnown?.trim();
  const audioUrl = card.audioUrl?.trim() || card.promptLexeme?.audioUrl?.trim();

  if (!primary) {
    return [
      {
        character: '',
        pinyin: card.promptLexeme?.pinyin,
        glossKnown: meaning,
        strokeGuides: card.strokeGuides,
        radicalHint: card.radicalHint,
        audioUrl: audioUrl || undefined,
      },
    ];
  }

  const characters = [...primary];
  const pinyinParts = splitPinyinSyllables(card.promptLexeme?.pinyin, characters.length);
  const zhuyinParts = splitPinyinSyllables(card.promptLexeme?.zhuyin, characters.length);
  const palladiusParts = splitPinyinSyllables(card.promptLexeme?.palladius, characters.length);

  return characters.map((character, index) => ({
    character,
    pinyin: pinyinParts[index],
    zhuyin: zhuyinParts[index],
    palladius: palladiusParts[index],
    glossKnown: index === 0 ? meaning : undefined,
    strokeGuides: index === 0 ? card.strokeGuides : undefined,
    radicalHint: index === 0 ? card.radicalHint : undefined,
    audioUrl: index === 0 ? audioUrl || undefined : undefined,
  }));
}

export function drawCharacterTabPinyinLabel(target: DrawCharacterTarget, index = 0): string {
  const pinyin = target.pinyin?.trim();
  return pinyin || String(index + 1);
}

export function drawCharacterTabLabel(target: DrawCharacterTarget, index = 0): string {
  const pinyin = target.pinyin?.trim();
  if (pinyin) {
    return pinyin;
  }

  const zhuyin = target.zhuyin?.trim();
  if (zhuyin) {
    return zhuyin;
  }

  const palladius = target.palladius?.trim();
  if (palladius) {
    return palladius;
  }

  return String(index + 1);
}

export function buildDrawPhoneticsLexeme(
  source: PhoneticLexeme,
  options?: { ipa?: PhoneticLexeme['ipa'] },
): PhoneticLexeme {
  return {
    primary: '',
    script: 'latn',
    pinyin: source.pinyin,
    zhuyin: source.zhuyin,
    palladius: source.palladius,
    ipa: options?.ipa ?? source.ipa,
  };
}

export function buildDrawTabLexeme(
  target: DrawCharacterTarget,
  card: DrawCard,
  index: number,
): PhoneticLexeme {
  return buildDrawPhoneticsLexeme(
    {
      primary: '',
      script: 'latn',
      pinyin: target.pinyin,
      zhuyin: target.zhuyin,
      palladius: target.palladius,
    },
    { ipa: index === 0 ? card.promptLexeme?.ipa : undefined },
  );
}

export function resolveDrawPromptLexeme(card: DrawCard): PhoneticLexeme | null {
  const lexeme = card.promptLexeme;
  if (!lexeme) {
    return null;
  }

  const phonetics = buildDrawPhoneticsLexeme(lexeme);
  if (!phonetics.pinyin?.trim() && !phonetics.zhuyin?.trim() && !phonetics.palladius?.trim() && !phonetics.ipa) {
    return null;
  }

  return phonetics;
}

export function initialDrawCanvasMode(): DrawCanvasMode {
  return 'memory';
}
