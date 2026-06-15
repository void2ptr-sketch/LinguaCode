import {
  DEFAULT_PHONETIC_PREFERENCES,
  ROMANIZATION_DISPLAY_ORDER,
  type RomanizationSystem,
} from '../../../core/models/phonetic-content.types';

export type AnswerDisplayMode = 'orthography' | 'ipa';

export function toggleRomanizations(
  current: readonly RomanizationSystem[],
  system: RomanizationSystem,
  enabled: boolean,
): readonly RomanizationSystem[] {
  const selected = new Set(current);

  if (enabled) {
    selected.add(system);
  } else {
    selected.delete(system);
  }

  return ROMANIZATION_DISPLAY_ORDER.filter((item) => selected.has(item));
}

export function toggleAnswerModes(
  current: readonly AnswerDisplayMode[],
  mode: AnswerDisplayMode,
  enabled: boolean,
): readonly AnswerDisplayMode[] {
  const selected = new Set(current);

  if (enabled) {
    selected.add(mode);
  } else {
    selected.delete(mode);
  }

  return [...selected];
}

export function normalizeRomanizationsForSave(
  current: readonly RomanizationSystem[],
  fallback: readonly RomanizationSystem[],
): readonly RomanizationSystem[] {
  return current.length > 0 ? [...current] : [...fallback];
}

export function normalizeAnswerModesForSave(
  current: readonly AnswerDisplayMode[],
): readonly AnswerDisplayMode[] {
  return current.length > 0 ? [...current] : [...DEFAULT_PHONETIC_PREFERENCES.answerModes];
}
