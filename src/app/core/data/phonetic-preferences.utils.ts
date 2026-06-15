import type {
  CjkLearningPreferences,
  PhoneticPreferences,
  RomanizationSystem,
} from '../models/phonetic-content.types';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
  ROMANIZATION_DISPLAY_ORDER,
} from '../models/phonetic-content.types';

const ROMANIZATION_SYSTEMS: readonly RomanizationSystem[] = ['pinyin', 'zhuyin', 'palladius'];

function isRomanizationSystem(value: unknown): value is RomanizationSystem {
  return typeof value === 'string' && ROMANIZATION_SYSTEMS.includes(value as RomanizationSystem);
}

type LegacyCjkLearningPreferences = Partial<CjkLearningPreferences> & {
  displayRomanization?: RomanizationSystem;
};

function normalizeDisplayRomanizations(raw?: LegacyCjkLearningPreferences | null): readonly RomanizationSystem[] {
  const fromArray = Array.isArray(raw?.displayRomanizations)
    ? raw.displayRomanizations.filter(isRomanizationSystem)
    : [];

  const fromLegacy =
    fromArray.length === 0 && isRomanizationSystem(raw?.displayRomanization)
      ? [raw.displayRomanization]
      : fromArray;

  const ordered = ROMANIZATION_DISPLAY_ORDER.filter((system) => fromLegacy.includes(system));

  if (ordered.length > 0) {
    return ordered;
  }

  return [...DEFAULT_CJK_LEARNING_PREFERENCES.displayRomanizations];
}

export function normalizeCjkLearningPreferences(
  raw?: LegacyCjkLearningPreferences | null,
): CjkLearningPreferences {
  const answerRomanization = Array.isArray(raw?.answerRomanization)
    ? raw.answerRomanization.filter(isRomanizationSystem)
    : [...DEFAULT_CJK_LEARNING_PREFERENCES.answerRomanization];

  return {
    displayRomanizations: normalizeDisplayRomanizations(raw),
    answerRomanization:
      answerRomanization.length > 0
        ? answerRomanization
        : [...DEFAULT_CJK_LEARNING_PREFERENCES.answerRomanization],
    showTones: raw?.showTones ?? DEFAULT_CJK_LEARNING_PREFERENCES.showTones,
  };
}

export function normalizePhoneticPreferences(
  raw?: Partial<PhoneticPreferences> | null,
): PhoneticPreferences {
  const answerModes = Array.isArray(raw?.answerModes)
    ? raw.answerModes.filter((mode): mode is 'orthography' | 'ipa' => mode === 'orthography' || mode === 'ipa')
    : [...DEFAULT_PHONETIC_PREFERENCES.answerModes];

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
    answerModes: answerModes.length > 0 ? answerModes : [...DEFAULT_PHONETIC_PREFERENCES.answerModes],
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
