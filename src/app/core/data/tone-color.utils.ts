import { parsePinyinSyllable } from './pinyin-to-ipa.utils';
import type { ToneMark } from '../models/phonetic-content.types';
import type { ToneColorPalette, ToneColorSchemeId } from '../models/tone-color.types';
import {
  DEFAULT_TONE_COLOR_SCHEME_ID,
  TONE_COLOR_SCHEMES,
} from '../models/tone-color.types';

export type ToneTextSegment = {
  text: string;
  tone: ToneMark;
};

const SCHEME_BY_ID = new Map(TONE_COLOR_SCHEMES.map((scheme) => [scheme.id, scheme]));

export function isToneColorSchemeId(value: unknown): value is ToneColorSchemeId {
  return typeof value === 'string' && SCHEME_BY_ID.has(value as ToneColorSchemeId);
}

export function resolveToneColorScheme(id?: ToneColorSchemeId | null) {
  if (id && SCHEME_BY_ID.has(id)) {
    return SCHEME_BY_ID.get(id)!;
  }

  return SCHEME_BY_ID.get(DEFAULT_TONE_COLOR_SCHEME_ID)!;
}

export function resolveToneColorPalette(id?: ToneColorSchemeId | null): ToneColorPalette {
  return resolveToneColorScheme(id).colors;
}

export function toneColorForMark(palette: ToneColorPalette, tone: ToneMark): string {
  return palette[tone];
}

export function inferTonesFromPinyin(pinyin: string | undefined, count: number): readonly ToneMark[] {
  if (count <= 0) {
    return [];
  }

  if (!pinyin?.trim()) {
    return Array.from({ length: count }, () => 5 as ToneMark);
  }

  const syllables = pinyin.trim().split(/\s+/);
  if (syllables.length === count) {
    return syllables.map((syllable) => parsePinyinSyllable(syllable).tone);
  }

  if (count === 1) {
    return [parsePinyinSyllable(pinyin.trim()).tone];
  }

  return Array.from({ length: count }, (_, index) =>
    syllables[index] ? parsePinyinSyllable(syllables[index]).tone : 5,
  );
}

export function segmentHanText(
  primary: string,
  pinyin?: string,
  tones?: readonly ToneMark[],
): readonly ToneTextSegment[] {
  const characters = [...primary.trim()];
  if (characters.length === 0) {
    return [];
  }

  const toneList = tones?.length === characters.length
    ? tones
    : inferTonesFromPinyin(pinyin, characters.length);

  return characters.map((character, index) => ({
    text: character,
    tone: toneList[index] ?? 5,
  }));
}

export function segmentPinyinText(pinyin: string): readonly ToneTextSegment[] {
  const trimmed = pinyin.trim();
  if (!trimmed) {
    return [];
  }

  const parts = trimmed.split(/(\s+)/);
  const segments: ToneTextSegment[] = [];

  for (const part of parts) {
    if (!part) {
      continue;
    }

    if (/^\s+$/.test(part)) {
      segments.push({ text: part, tone: 5 });
      continue;
    }

    segments.push({
      text: part,
      tone: parsePinyinSyllable(part).tone,
    });
  }

  return segments;
}

export function segmentToneText(
  text: string,
  mode: 'han' | 'pinyin',
  options?: {
    pinyin?: string;
    tones?: readonly ToneMark[];
    fixedTone?: ToneMark | null;
  },
): readonly ToneTextSegment[] {
  if (options?.fixedTone) {
    return [{ text, tone: options.fixedTone }];
  }

  if (mode === 'han') {
    return segmentHanText(text, options?.pinyin, options?.tones);
  }

  return segmentPinyinText(text);
}
