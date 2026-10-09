import {
  ROMANIZATION_DISPLAY_ORDER,
  type RomanizationSystem,
} from '../../../core/models/phonetic-content.types';

/**
 * Display mode for answers: orthography (text) or IPA transcription.
 *
 * @remarks
 * Used in phonetic preferences to control which answer modes are allowed.
 */
export type AnswerDisplayMode = 'orthography' | 'ipa';

/**
 * Toggles a romanization system in the display list.
 *
 * @param current - The current list of enabled romanization systems.
 * @param system - The romanization system to toggle.
 * @param enabled - Whether to add (true) or remove (false) the system.
 * @returns The updated list, filtered to only known systems and sorted by `ROMANIZATION_DISPLAY_ORDER`.
 */
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

/**
 * Toggles an answer mode in the allowed modes list.
 *
 * @param current - The current list of allowed answer modes.
 * @param mode - The answer mode to toggle.
 * @param enabled - Whether to add (true) or remove (false) the mode.
 * @returns The updated list of allowed answer modes.
 */
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

/**
 * Normalizes romanizations for saving to preferences.
 *
 * @param current - The current list of romanization systems.
 * @returns A shallow copy of the input array.
 */
export function normalizeRomanizationsForSave(
  current: readonly RomanizationSystem[],
): readonly RomanizationSystem[] {
  return [...current];
}

/**
 * Normalizes answer modes for saving to preferences.
 *
 * @param current - The current list of answer modes.
 * @returns A shallow copy of the input array.
 */
export function normalizeAnswerModesForSave(
  current: readonly AnswerDisplayMode[],
): readonly AnswerDisplayMode[] {
  return [...current];
}
