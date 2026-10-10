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
export type { RadicalHintPart } from './draw-card.utils';
export {
  HAN_COMPONENT_PINYIN,
  HAN_RADICAL_HINTS,
  lookupHanComponentPinyin,
  lookupHanRadicalHint,
  primaryHanCharacter,
} from './draw-stroke-guides.data';
export type { CanvasPoint, CalligraphyPaintOptions } from './draw-calligraphy-paint.utils';
export { paintCalligraphyPolyline } from './draw-calligraphy-paint.utils';
