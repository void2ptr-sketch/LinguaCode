// ===== Services =====
export { CardsApiService } from './cards-api.service';
export { CardSearchService } from './card-search.service';

// ===== Repositories =====
export { CARDS_STORAGE_KEY, CardRepository } from './card.repository';

// ===== Utils =====
export {
  buildCardSearchFacets,
  filterCardIndex,
  matchesCardIndexEntry,
  toSearchFilters,
} from './card-search.utils';
export {
  collectCardIpaReadings,
  cardHasIpaContent,
  collectLexemeIpaReadings,
} from './card-ipa-index.utils';
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
export type { ResolvedOptionCard, ResolvedMemoryPair } from './card-direction.utils';
export { DEFAULT_CARD_FOCUS_FULLSCREEN, normalizeCardFocusFullscreen } from './card-focus-preference.utils';
export type { PlayLearningAudioOptions, LearningSpeech } from './card-learning-audio.utils';
export {
  contentLanguageSpeechLocale,
  resolveLearningSpeech,
  playLearningAudio,
} from './card-learning-audio.utils';

// ===== Mappers =====
export {
  buildCardIndex,
  cardToIndexEntry,
  type CardIndexMetaFixture,
  type CardIndexMetaOverride,
} from './card-index.mapper';
export { normalizeLegacyCard, normalizeLegacyCards } from './card-legacy.mapper';
