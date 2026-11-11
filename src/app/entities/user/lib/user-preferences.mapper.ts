/**
 * Mapper: frontend `UserPreferences` state → backend `PUT /users/me/preferences`
 * payload (generated `UserPreferences` model).
 *
 * @remarks
 * The frontend and backend preference types differ in shape and enum casing.
 * All conversions live here so that no component or store ever needs
 * `as unknown as` casts when talking to the backend API.
 */
import type {
  CjkLearningSettings,
  LanguagePairEntry,
  LanguagePairEntrySettings,
  LearningSessionSettings,
  PhoneticSettings,
  PhoneticSettingsAnswerModesItem,
  UserPreferences as GeneratedUserPreferences,
  UserPreferencesCardFontSize,
} from '../../../shared/api/generated/models';
import type { AppColorScheme } from '../../../shared/theme/app-color-scheme.types';
import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type { LearningProficiencyLevel } from '../../learning/model/learning-proficiency.types';
import type {
  UserLanguagePairEntry,
  UserLanguagePairSettings,
} from '../model/user-language-pair.types';
import type { UserPreferences } from '../model/user.types';

/** Frontend font size → backend `cardFontSize` enum. */
const FONT_SIZE_TO_BACKEND: Record<UserPreferences['fontSize'], UserPreferencesCardFontSize> = {
  sm: 'SMALL',
  md: 'MEDIUM',
  lg: 'LARGE',
};

/** Frontend answer mode → backend `PhoneticSettingsAnswerModesItem` enum. */
const ANSWER_MODE_TO_BACKEND: Record<
  'orthography' | 'ipa',
  PhoneticSettingsAnswerModesItem
> = {
  orthography: 'ORTHOGRAPHY',
  ipa: 'IPA',
};

/** Input needed to build the backend preferences payload. */
export type PreferencesPayloadInput = {
  theme: string;
  fontSize: UserPreferences['fontSize'];
  colorScheme: AppColorScheme;
  cardFocusFullscreen: boolean;
  learningProficiencyLevel: LearningProficiencyLevel;
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string | undefined;
  activeByMirrorGroup: Record<string, LanguagePair>;
};

/**
 * Maps frontend phonetic preferences to the backend `PhoneticSettings` shape.
 *
 * @remarks
 * Lowercase frontend answer modes are uppercased to the backend enum; unknown
 * modes fall back to uppercase passthrough (same leniency as the previous
 * inline mapping in `user-page`).
 */
export function toBackendPhoneticSettings(
  phonetic: UserLanguagePairSettings['phonetic'],
): PhoneticSettings | undefined {
  if (!phonetic) {
    return undefined;
  }
  return {
    showIpa: phonetic.showIpa,
    answerModes: (phonetic.answerModes ?? []).map(
      (mode) => ANSWER_MODE_TO_BACKEND[mode] ?? (mode.toUpperCase() as PhoneticSettingsAnswerModesItem),
    ),
  };
}

/**
 * Maps frontend CJK learning preferences to the backend `CjkLearningSettings`.
 *
 * @remarks
 * Frontend romanization arrays are `readonly` — they are copied into mutable
 * arrays expected by the generated backend model. The field names and value
 * types (`string[]`, `string`, `number`, `boolean`) match one-to-one.
 */
export function toBackendCjkLearningSettings(
  cjkLearning: UserLanguagePairSettings['cjkLearning'],
): CjkLearningSettings | undefined {
  if (!cjkLearning) {
    return undefined;
  }
  return {
    displayRomanizations: [...cjkLearning.displayRomanizations],
    answerRomanization: [...cjkLearning.answerRomanization],
    showTones: cjkLearning.showTones,
    toneColorScheme: cjkLearning.toneColorScheme,
    tracingStrokeDurationSec: cjkLearning.tracingStrokeDurationSec,
  };
}

/**
 * Maps frontend learning-session preferences to the backend `LearningSessionSettings`.
 *
 * @remarks
 * The backend stores per-pair learning state as a flexible JSON document:
 * the frontend fields (`activeCourseId`, `activeProgramId`, `lastLessonId`,
 * `lastScenarioId`) are passed through unchanged. The explicit cast is
 * centralized here — the two interfaces currently share no fields, so no
 * cast-free mapping exists.
 */
export function toBackendLearningSessionSettings(
  learning: UserLanguagePairSettings['learning'],
): LearningSessionSettings | undefined {
  if (!learning) {
    return undefined;
  }
  return { ...learning } as LearningSessionSettings;
}

/**
 * Maps a frontend per-pair settings object to the backend
 * `LanguagePairEntrySettings`.
 */
export function toBackendLanguagePairSettings(
  settings: UserLanguagePairSettings | undefined,
): LanguagePairEntrySettings | undefined {
  if (!settings) {
    return undefined;
  }
  return {
    phonetic: toBackendPhoneticSettings(settings.phonetic),
    cjkLearning: toBackendCjkLearningSettings(settings.cjkLearning),
    learning: toBackendLearningSessionSettings(settings.learning),
  };
}

/** Flattens a frontend language-pair entry into a backend `LanguagePairEntry`. */
function toBackendLanguagePairEntry(entry: UserLanguagePairEntry): LanguagePairEntry {
  return {
    known: entry.pair.known,
    learning: entry.pair.learning,
    settings: toBackendLanguagePairSettings(entry.settings),
  };
}

/**
 * Builds the backend `PUT /users/me/preferences` payload from frontend state.
 *
 * @param input - Draft preferences + current language-pair state.
 * @returns Payload matching the generated `UserPreferences` model.
 */
export function buildPreferencesPayload(input: PreferencesPayloadInput): GeneratedUserPreferences {
  return {
    theme: input.theme,
    cardFontSize: FONT_SIZE_TO_BACKEND[input.fontSize] ?? 'MEDIUM',
    colorScheme: input.colorScheme,
    cardFocusFullscreen: input.cardFocusFullscreen,
    learningProficiencyLevel: input.learningProficiencyLevel,
    // Flatten frontend languagePairs → backend learningPairs
    learningPairs: input.languagePairs.map(toBackendLanguagePairEntry),
    activeLanguagePairId: input.activeLanguagePairId,
    activeByMirrorGroup: input.activeByMirrorGroup,
  };
}
