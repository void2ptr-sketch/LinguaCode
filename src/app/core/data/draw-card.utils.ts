import type { DrawCard } from '../models';
import type { DrawCanvasMode, DrawCharacterTarget } from '../models/draw-practice.types';

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

const HAN_SCRIPT_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

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

/** Текст вопроса на известном языке — без иероглифов и без promptKnown. */
export function resolveDrawQuestion(card: DrawCard): string {
  const candidates = [
    card.meaningKnown?.trim(),
    card.promptLexeme?.glossKnown?.trim(),
    card.referenceHintKnown?.trim(),
    extractKnownLanguageFromTitle(card.title),
  ].filter((value): value is string => Boolean(value?.length));

  for (const text of candidates) {
    if (!containsHanScript(text)) {
      return text;
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

  return characters.map((character, index) => ({
    character,
    pinyin: pinyinParts[index],
    zhuyin: zhuyinParts[index],
    glossKnown: index === 0 ? meaning : undefined,
    strokeGuides: index === 0 ? card.strokeGuides : undefined,
    radicalHint: index === 0 ? card.radicalHint : undefined,
    audioUrl: index === 0 ? audioUrl || undefined : undefined,
  }));
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

  return String(index + 1);
}

export function initialDrawCanvasMode(): DrawCanvasMode {
  return 'memory';
}
