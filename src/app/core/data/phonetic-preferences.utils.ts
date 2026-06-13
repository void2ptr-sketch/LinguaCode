import type {
  CjkLearningPreferences,
  PhoneticPreferences,
  RomanizationSystem,
} from '../models/phonetic-content.types';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from '../models/phonetic-content.types';

const ROMANIZATION_SYSTEMS: readonly RomanizationSystem[] = ['pinyin', 'zhuyin', 'palladius'];

function isRomanizationSystem(value: unknown): value is RomanizationSystem {
  return typeof value === 'string' && ROMANIZATION_SYSTEMS.includes(value as RomanizationSystem);
}

export function normalizeCjkLearningPreferences(
  raw?: Partial<CjkLearningPreferences> | null,
): CjkLearningPreferences {
  const displayRomanization = isRomanizationSystem(raw?.displayRomanization)
    ? raw.displayRomanization
    : DEFAULT_CJK_LEARNING_PREFERENCES.displayRomanization;

  const answerRomanization = Array.isArray(raw?.answerRomanization)
    ? raw.answerRomanization.filter(isRomanizationSystem)
    : [...DEFAULT_CJK_LEARNING_PREFERENCES.answerRomanization];

  return {
    displayRomanization,
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
