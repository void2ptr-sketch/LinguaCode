import type {
  CjkLearningPreferences,
  PhoneticPreferences,
  RomanizationSystem,
} from '../../models/phonetic-content.types';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
  ROMANIZATION_DISPLAY_ORDER,
  TRACING_STROKE_DURATION_BOUNDS,
} from '../../models/phonetic-content.types';
import { isToneColorSchemeId } from '../chinese/tone-color.utils';
import { DEFAULT_TONE_COLOR_SCHEME_ID } from '../../models/tone-color.types';

const ROMANIZATION_SYSTEMS: readonly RomanizationSystem[] = ['pinyin', 'zhuyin', 'palladius'];

function isRomanizationSystem(value: unknown): value is RomanizationSystem {
  return typeof value === 'string' && ROMANIZATION_SYSTEMS.includes(value as RomanizationSystem);
}

type LegacyCjkLearningPreferences = Partial<CjkLearningPreferences> & {
  displayRomanization?: RomanizationSystem;
};

function normalizeRomanizationList(values: readonly unknown[]): readonly RomanizationSystem[] {
  const selected = values.filter(isRomanizationSystem);
  return ROMANIZATION_DISPLAY_ORDER.filter((system) => selected.includes(system));
}

function normalizeDisplayRomanizations(
  raw?: LegacyCjkLearningPreferences | null,
): readonly RomanizationSystem[] {
  if (raw && 'displayRomanizations' in raw && Array.isArray(raw.displayRomanizations)) {
    return normalizeRomanizationList(raw.displayRomanizations);
  }

  if (isRomanizationSystem(raw?.displayRomanization)) {
    return [raw.displayRomanization];
  }

  return [...DEFAULT_CJK_LEARNING_PREFERENCES.displayRomanizations];
}

function normalizeAnswerRomanization(
  raw?: LegacyCjkLearningPreferences | null,
): readonly RomanizationSystem[] {
  if (raw && 'answerRomanization' in raw && Array.isArray(raw.answerRomanization)) {
    return normalizeRomanizationList(raw.answerRomanization);
  }

  return [...DEFAULT_CJK_LEARNING_PREFERENCES.answerRomanization];
}

export function normalizeTracingStrokeDurationSec(value?: number | null): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return TRACING_STROKE_DURATION_BOUNDS.defaultSec;
  }

  const rounded = Math.round(value * 10) / 10;
  return Math.min(
    TRACING_STROKE_DURATION_BOUNDS.maxSec,
    Math.max(TRACING_STROKE_DURATION_BOUNDS.minSec, rounded),
  );
}

export function normalizeCjkLearningPreferences(
  raw?: LegacyCjkLearningPreferences | null,
): CjkLearningPreferences {
  return {
    displayRomanizations: normalizeDisplayRomanizations(raw),
    answerRomanization: normalizeAnswerRomanization(raw),
    showTones: raw?.showTones ?? DEFAULT_CJK_LEARNING_PREFERENCES.showTones,
    toneColorScheme: isToneColorSchemeId(raw?.toneColorScheme)
      ? raw.toneColorScheme
      : DEFAULT_TONE_COLOR_SCHEME_ID,
    tracingStrokeDurationSec: normalizeTracingStrokeDurationSec(raw?.tracingStrokeDurationSec),
  };
}

const ANSWER_DISPLAY_MODES: readonly ('orthography' | 'ipa')[] = ['orthography', 'ipa'];

function isAnswerDisplayMode(value: unknown): value is 'orthography' | 'ipa' {
  return value === 'orthography' || value === 'ipa';
}

function normalizeAnswerModes(
  raw?: Partial<PhoneticPreferences> | null,
): readonly PhoneticPreferences['answerModes'][number][] {
  if (raw && 'answerModes' in raw && Array.isArray(raw.answerModes)) {
    const selected = raw.answerModes.filter(isAnswerDisplayMode);
    return ANSWER_DISPLAY_MODES.filter((mode) => selected.includes(mode));
  }

  return [...DEFAULT_PHONETIC_PREFERENCES.answerModes];
}

export function normalizePhoneticPreferences(
  raw?: Partial<PhoneticPreferences> | null,
): PhoneticPreferences {
  return {
    showIpa: raw?.showIpa ?? DEFAULT_PHONETIC_PREFERENCES.showIpa,
    ipaVariantLabel:
      typeof raw?.ipaVariantLabel === 'string' && raw.ipaVariantLabel.trim()
        ? raw.ipaVariantLabel.trim()
        : undefined,
    displayOrthography: isRomanizationSystem(raw?.displayOrthography)
      ? raw.displayOrthography
      : raw?.displayOrthography === 'orthographic'
        ? 'orthographic'
        : undefined,
    answerModes: normalizeAnswerModes(raw),
  };
}

export function shouldShowPalladius(known: string, learning: string): boolean {
  return known === 'ru' && learning === 'zh';
}

export function pairSupportsPhoneticDisplay(learning: string): boolean {
  return learning === 'en' || learning === 'zh';
}

export function isRomanizationDisplayEnabled(
  prefs: CjkLearningPreferences,
  system: RomanizationSystem,
): boolean {
  return prefs.displayRomanizations.includes(system);
}

export type LexemeDisplaySurface = 'prompt' | 'answer';

export type AnswerDisplayMode = PhoneticPreferences['answerModes'][number];

export function resolveRomanizationsForSurface(
  surface: LexemeDisplaySurface,
  cjk: CjkLearningPreferences,
  phonetic: PhoneticPreferences,
): readonly RomanizationSystem[] {
  if (surface === 'prompt') {
    return cjk.displayRomanizations;
  }

  if (!phonetic.answerModes.includes('orthography')) {
    return [];
  }

  return cjk.answerRomanization;
}

export function resolveShowIpaForSurface(
  surface: LexemeDisplaySurface,
  phonetic: PhoneticPreferences,
): boolean {
  return surface === 'prompt' ? phonetic.showIpa : phonetic.answerModes.includes('ipa');
}
