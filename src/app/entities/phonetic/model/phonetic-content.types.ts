import type { ToneColorSchemeId } from './tone-color.types';

/**
 * ISO 15924 script code used for CJK and other writing systems.
 *
 * @remarks
 * `latn` — Latin, `hani` — Han characters (Chinese/Japanese), `bopo` — Bopomofo,
 * `hira` — Hiragana, `kana` — Katakana, `hang` — Hangul, `cyrl` — Cyrillic.
 */
export type ScriptCode = 'latn' | 'hani' | 'bopo' | 'hira' | 'kana' | 'hang' | 'cyrl';

/**
 * Mandarin tone mark: 1–4 for standard tones, 5 for neutral.
 *
 * @remarks
 * Used in tone coloring, tone recognition exercises, and phonetic metadata.
 */
export type ToneMark = 1 | 2 | 3 | 4 | 5;

/**
 * Supported romanization systems for CJK content.
 *
 * @remarks
 * `pinyin` — Chinese Pinyin, `zhuyin` — Chinese Bopomofo, `palladius` — Palladius system (Russian→Chinese).
 */
export type RomanizationSystem = 'pinyin' | 'zhuyin' | 'palladius';

/**
 * Orthography system: romanization or plain text display.
 *
 * @remarks
 * Extends `RomanizationSystem` with `orthographic` for raw text display.
 */
export type OrthographySystem = RomanizationSystem | 'orthographic';

/**
 * Supported phonetic notation format.
 *
 * @remarks
 * Currently only IPA (International Phonetic Alphabet) is supported.
 */
export type PhoneticNotation = 'ipa';

/**
 * An IPA transcription variant with optional label and locale.
 *
 * @remarks
 * Used when multiple IPA transcriptions are available for a single lexeme (e.g., regional variants).
 */
export type IpaVariant = {
  /** The IPA transcription string (e.g. "/ni hao/"). */
  transcription: string;
  /** Optional human-readable label (e.g. "Beijing", "Taipei"). */
  label?: string;
  /** Optional locale identifier (e.g. "zh-CN"). */
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

/**
 * CJK-specific lexeme with script enforced to 'hani'.
 *
 * @remarks
 * Guarantees that the script field is always 'hani' (Chinese characters).
 */
export type CjkLexeme = PhoneticLexeme & {
  script: 'hani';
};

/**
 * Display mode for CJK content: which romanization systems to show alongside Han characters.
 *
 * @remarks
 * `han-only` — characters without romanization; `han-pinyin` — characters + Pinyin;
 * `pinyin-only` — Pinyin without characters. Used in card display preferences.
 */
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

/**
 * Bounds for stroke animation duration in tracing mode.
 *
 * @remarks
 * Used by `CjkLearningPreferences.tracingStrokeDurationSec` to validate user input.
 */
export const TRACING_STROKE_DURATION_BOUNDS = {
  minSec: 0.1,
  maxSec: 2,
  defaultSec: 1,
  stepSec: 0.1,
} as const;

/**
 * Display mode for phonetic content: which IPA/orthography elements to show.
 *
 * @remarks
 * `primary-only` — lexeme text only; `primary-ipa` — lexeme + IPA;
 * `primary-orthography` — lexeme + romanization; `primary-orthography-ipa` — all three.
 */
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

/**
 * Default display order for romanization systems in the UI.
 *
 * @remarks
 * Used to sort romanization columns in the card catalog and card display.
 * Pinyin is shown first, followed by Zhuyin and Palladius.
 */
export const ROMANIZATION_DISPLAY_ORDER: readonly RomanizationSystem[] = [
  'pinyin',
  'zhuyin',
  'palladius',
];

/**
 * Default CJK learning preferences applied when no user settings exist.
 *
 * @remarks
 * Shows Pinyin romanization, disables tone coloring, and uses classic tone palette.
 */
export const DEFAULT_CJK_LEARNING_PREFERENCES: CjkLearningPreferences = {
  displayRomanizations: ['pinyin'],
  answerRomanization: ['pinyin', 'palladius'],
  showTones: false,
  toneColorScheme: 'classic',
  tracingStrokeDurationSec: TRACING_STROKE_DURATION_BOUNDS.defaultSec,
};

/**
 * Default phonetic preferences applied when no user settings exist.
 *
 * @remarks
 * Hides IPA, accepts orthography (text) answers only.
 */
export const DEFAULT_PHONETIC_PREFERENCES: PhoneticPreferences = {
  showIpa: false,
  answerModes: ['orthography'],
};
