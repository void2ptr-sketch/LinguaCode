export {
  effectiveCardDirection,
  cardDefaultDirection,
  extractQuotedLemma,
  resolveOptionCard,
  resolveMemoryPairs,
  resolveCardPrompt,
  resolveKeyboardPrompt,
  resolveKeyboardAcceptedAnswers,
  deriveKnownOptionsFromLexemes,
  cardSupportsSessionDirection,
} from './card-direction.utils';
export type { ResolvedOptionCard, ResolvedMemoryPair } from '../../../models/card-resolution.types';
export {
  collectCardIpaReadings,
  cardHasIpaContent,
  collectLexemeIpaReadings,
} from './card-ipa-index.utils';
export {
  contentLanguageSpeechLocale,
  resolveLearningSpeech,
  playLearningAudio,
} from './card-learning-audio.utils';
export type { PlayLearningAudioOptions, LearningSpeech } from './card-learning-audio.utils';
export {
  DEFAULT_CARD_FOCUS_FULLSCREEN,
  normalizeCardFocusFullscreen,
} from './card-focus-preference.utils';
