export type ScriptCode = 'latn' | 'hani' | 'bopo' | 'hira' | 'kana' | 'hang' | 'cyrl';

export type ToneMark = 1 | 2 | 3 | 4 | 5;

export type RomanizationSystem = 'pinyin' | 'zhuyin' | 'palladius';

export type OrthographySystem = RomanizationSystem | 'orthographic';

export type PhoneticNotation = 'ipa';

export type IpaVariant = {
  transcription: string;
  label?: string;
  locale?: string;
};

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

export type CjkLexeme = PhoneticLexeme & {
  script: 'hani';
};

export type CjkDisplayMode =
  | 'han-only'
  | 'han-pinyin'
  | 'han-zhuyin'
  | 'han-palladius'
  | 'pinyin-only'
  | 'zhuyin-only'
  | 'palladius-only';

export type CjkLearningPreferences = {
  /** Какие системы романизации показывать на карточках (режим «И», не «ИЛИ»). */
  displayRomanizations: readonly RomanizationSystem[];
  answerRomanization: readonly RomanizationSystem[];
  showTones: boolean;
};

export type PhoneticDisplayMode =
  | 'primary-only'
  | 'primary-ipa'
  | 'primary-orthography'
  | 'primary-orthography-ipa';

export type PhoneticPreferences = {
  showIpa: boolean;
  ipaVariantLabel?: string;
  displayOrthography?: OrthographySystem;
  answerModes: readonly ('orthography' | 'ipa')[];
};

export const ROMANIZATION_DISPLAY_ORDER: readonly RomanizationSystem[] = ['pinyin', 'zhuyin', 'palladius'];

export const DEFAULT_CJK_LEARNING_PREFERENCES: CjkLearningPreferences = {
  displayRomanizations: ['pinyin'],
  answerRomanization: ['pinyin', 'palladius'],
  showTones: true,
};

export const DEFAULT_PHONETIC_PREFERENCES: PhoneticPreferences = {
  showIpa: false,
  answerModes: ['orthography'],
};
