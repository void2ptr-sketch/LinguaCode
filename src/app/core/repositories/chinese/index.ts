// ===== Utils =====
export {
  normalizePalladiusAnswer,
  normalizePinyinAnswer,
  normalizeZhuyinAnswer,
  normalizeHanAnswer,
  normalizeRomanizationAnswer,
  answersMatchRomanization,
} from './cjk-answer-normalize.utils';
export {
  stripPinyinTones,
  pinyinSyllableToPalladius,
  pinyinToPalladius,
} from './cjk-romanization.utils';
export type { CanvasPoint, CalligraphyPaintOptions } from './draw-calligraphy-paint.utils';
export { paintCalligraphyPolyline } from './draw-calligraphy-paint.utils';
export type { RadicalHintPart } from './draw-card.utils';
export {
  splitPinyinSyllables,
  isHanCharacter,
  parseRadicalHintParts,
  containsHanScript,
  extractKnownLanguageFromTitle,
  stripHanScript,
  resolveDrawQuestion,
  resolveDrawMeaning,
  mergeDrawCardQuestionFields,
  resolveDrawAudioUrl,
  resolveDrawLearningSpeechText,
  resolveDrawCharacterTargets,
  drawCharacterTabPinyinLabel,
  drawCharacterTabLabel,
  buildDrawPhoneticsLexeme,
  buildDrawTabLexeme,
  resolveDrawPromptLexeme,
  resolveInitialDrawCanvasMode,
  initialDrawCanvasMode,
} from './draw-card.utils';
export {
  HAN_COMPONENT_PINYIN,
  HAN_RADICAL_HINTS,
  lookupHanComponentPinyin,
  lookupHanRadicalHint,
  primaryHanCharacter,
} from './draw-stroke-guides.data';
export type { LexemeDraftFields } from './lexeme-draft.utils';
export {
  emptyLexemeDraftFields,
  lexemeToDraftFields,
  normalizePhoneticLexemeDraft,
  collectLexemeAcceptedAnswers,
} from './lexeme-draft.utils';
export type { PinyinKeyboardKey, PinyinKeyboardState } from './pinyin-keyboard.utils';
export {
  MAX_PENDING_SYLLABLE_LENGTH,
  PINYIN_TONE_MARKS,
  PINYIN_KEYBOARD_LETTER_ROWS,
  PINYIN_KEYBOARD_UTILITY_KEYS,
  PINYIN_KEYBOARD_LAYOUT,
  createPinyinKeyboardState,
  isPinyinKeyboardVowel,
  lastPendingVowel,
  formatPinyinKeyboardValue,
  toneKeyPreview,
  syllableSupportsToneMarking,
  shouldShowPinyinToneRow,
  pendingSyllableTonePreview,
  canApplyPinyinTone,
  applyPinyinKeyboardKey,
  pinyinKeyboardKeyLabel,
  pinyinKeyboardKeyAriaLabel,
  pinyinKeyboardToneKeyAriaLabel,
} from './pinyin-keyboard.utils';
export type { PinyinTone } from './pinyin-to-ipa.utils';
export {
  parsePinyinSyllable,
  pinyinSyllableToIpa,
  pinyinToIpa,
} from './pinyin-to-ipa.utils';
export {
  resolveRadicalComponentPalette,
  radicalComponentColor,
} from './radical-component-color.utils';
export type { RadicalComponentPalette } from './radical-component-color.utils';
export { MAX_RADICAL_COMPONENTS } from './radical-component-color.utils';
export {
  RADICALS_COURSE_ID,
  RADICALS_PER_SCENARIO,
  RADICALS_TOTAL,
  RADICALS_LESSON_COUNT,
  radicalCardId,
  radicalLessonCardIds,
  isObsoleteRadicalsCatalogItem,
} from './radicals-course.defaults';
export {
  applyToneToPinyinSyllable,
  DEFAULT_TONE_OPTIONS,
  normalizeToneOptions,
  toneMarkLabel,
} from './tone-mark.utils';
export {
  isToneColorSchemeId,
  resolveToneColorScheme,
  resolveToneColorPalette,
  toneColorForMark,
  inferTonesFromPinyin,
  segmentHanText,
  segmentPinyinText,
  segmentToneText,
} from './tone-color.utils';
export type { ToneTextSegment } from './tone-color.utils';
