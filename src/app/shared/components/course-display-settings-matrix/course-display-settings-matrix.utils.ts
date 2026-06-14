import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
  ROMANIZATION_DISPLAY_ORDER,
  type RomanizationSystem,
} from '../../../core/models/phonetic-content.types';

export type AnswerDisplayMode = 'orthography' | 'ipa';

export function toggleRomanizations(
  current: readonly RomanizationSystem[],
  system: RomanizationSystem,
  enabled: boolean,
  fallback: readonly RomanizationSystem[],
): readonly RomanizationSystem[] {
  const next = enabled
    ? ROMANIZATION_DISPLAY_ORDER.filter((item) => current.includes(item) || item === system)
    : current.filter((item) => item !== system);

  return next.length > 0 ? next : [...fallback];
}

export function isOnlyRomanizationEnabled(
  current: readonly RomanizationSystem[],
  system: RomanizationSystem,
): boolean {
  return current.length === 1 && current[0] === system;
}

export function toggleAnswerModes(
  current: readonly AnswerDisplayMode[],
  mode: AnswerDisplayMode,
  enabled: boolean,
): readonly AnswerDisplayMode[] {
  const next = enabled
    ? [...new Set([...current, mode])]
    : current.filter((item) => item !== mode);

  return next.length > 0 ? next : [...DEFAULT_PHONETIC_PREFERENCES.answerModes];
}

export function isOnlyAnswerModeEnabled(
  current: readonly AnswerDisplayMode[],
  mode: AnswerDisplayMode,
): boolean {
  return current.length === 1 && current[0] === mode;
}

export const DEFAULT_DISPLAY_ROMANIZATIONS = DEFAULT_CJK_LEARNING_PREFERENCES.displayRomanizations;
export const DEFAULT_ANSWER_ROMANIZATIONS = DEFAULT_CJK_LEARNING_PREFERENCES.answerRomanization;
