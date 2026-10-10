// ===== Utils =====
export {
  emptyPhoneticLexeme,
  lexemeFromPrimary,
  lexemeFromHan,
  hasLexemePhoneticLayers,
  hasLexemeContent,
  resolveIpaString,
  resolveRomanizationReading,
  resolveLexemeRubyAnnotation,
  resolveVisibleRomanizationReadings,
  mergeLexeme,
  parseIpaVariants,
  formatIpaForEditor,
} from './phonetic-lexeme.utils';
export {
  normalizeTracingStrokeDurationSec,
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  shouldShowPalladius,
  pairSupportsPhoneticDisplay,
  isRomanizationDisplayEnabled,
  resolveRomanizationsForSurface,
  resolveShowIpaForSurface,
} from './phonetic-preferences.utils';
export type { LexemeDisplaySurface, AnswerDisplayMode } from './phonetic-preferences.utils';
