import type { ToneColorSchemeId } from './tone-color.types';

/** ISO 15924 script code used for CJK and other writing systems. */
export type ScriptCode = 'latn' | 'hani' | 'bopo' | 'hira' | 'kana' | 'hang' | 'cyrl';

/** Mandarin tone mark: 1–4 for standard tones, 5 for neutral. */
export type ToneMark = 1 | 2 | 3 | 4 | 5;

/** Supported romanization systems for CJK content. */
export type RomanizationSystem = 'pinyin' | 'zhuyin' | 'palladius';

/** Orthography system: romanization or plain text. */
export type OrthographySystem = RomanizationSystem | 'orthographic';

/** Supported phonetic notation format. */
export type PhoneticNotation = 'ipa';

/** An IPA transcription variant with optional label and locale. */
export type IpaVariant = {
  transcription: string;
  label?: string;
  locale?: string;
};

/**
 * A lexeme with phonetic metadata for display and answer checking.
 *
 * @remarks
 * Contains primary text, script code, romanizations (pinyin/zhuyin/palladius), IPA, and optional audio.
 */
export type PhoneticLexeme = {
  primary: string;
  script: ScriptCode;
  pinyin?: string;
  zhuyin?: string;
  palladius?: string;
  ipa?: string | readonly IpaVariant[];
  glossKnown?: string;
  audioUrl?: string;
  tones?: readonly ToneMark[];
  acceptedReadings?: readonly string[];
};

/** CJK-specific lexeme with script enforced to 'hani'. */
export type CjkLexeme = PhoneticLexeme & {
  script: 'hani';
};

/** Display mode for CJK content: which romanization systems to show alongside Han characters. */
export type CjkDisplayMode =
  | 'han-only'
  | 'han-pinyin'
  | 'han-zhuyin'
  | 'han-palladius'
  | 'pinyin-only'
  | 'zhuyin-only'
  | 'palladius-only';

/**
 * CJK-specific learning preferences for a language pair.
 *
 * @remarks
 * Controls romanization display, tone coloring, and stroke animation settings.
 */
export type CjkLearningPreferences = {
  /** Romanization systems to display on cards (AND mode, not OR). */
  displayRomanizations: readonly RomanizationSystem[];
  answerRomanization: readonly RomanizationSystem[];
  /** Enable tone coloring for characters and Pinyin. */
  showTones: boolean;
  /** Tone color palette (when `showTones` is enabled). */
  toneColorScheme: ToneColorSchemeId;
  /** Duration of a single stroke animation in tracing mode, in seconds. */
  tracingStrokeDurationSec: number;
};

export const TRACING_STROKE_DURATION_BOUNDS = {
  minSec: 0.1,
  maxSec: 2,
  defaultSec: 1,
  stepSec: 0.1,
} as const;

/** Display mode for phonetic content: which IPA/orthography elements to show. */
export type PhoneticDisplayMode =
  | 'primary-only'
  | 'primary-ipa'
  | 'primary-orthography'
  | 'primary-orthography-ipa';

/**
 * Phonetic display and answer mode preferences.
 *
 * @remarks
 * Controls IPA visibility, orthography system, and allowed answer modes.
 */
export type PhoneticPreferences = {
  showIpa: boolean;
  ipaVariantLabel?: string;
  displayOrthography?: OrthographySystem;
  answerModes: readonly ('orthography' | 'ipa')[];
};

export const ROMANIZATION_DISPLAY_ORDER: readonly RomanizationSystem[] = [
  'pinyin',
  'zhuyin',
  'palladius',
];

export const DEFAULT_CJK_LEARNING_PREFERENCES: CjkLearningPreferences = {
  displayRomanizations: ['pinyin'],
  answerRomanization: ['pinyin', 'palladius'],
  showTones: false,
  toneColorScheme: 'classic',
  tracingStrokeDurationSec: TRACING_STROKE_DURATION_BOUNDS.defaultSec,
};

export const DEFAULT_PHONETIC_PREFERENCES: PhoneticPreferences = {
  showIpa: false,
  answerModes: ['orthography'],
};
