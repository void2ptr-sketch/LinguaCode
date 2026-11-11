// ===== Utils =====
export {
  formatLanguagePair,
  isContentLanguage,
  normalizeLanguagePair,
  languagePairsEqual,
  buildMirrorGroupKey,
  cardIndexMatchesPair,
  cardSearchCriteriaMatchesPair,
  languagePairFromIndexEntry,
  formatIndexLanguagePair,
  buildLanguageLabels,
} from './language-pair.utils';
export {
  activeLanguagePairCriteria,
  scenarioIndexMatchesLanguagePair,
  courseIndexMatchesLanguagePair,
  scenarioIndexMatchesLanguageCriteria,
  courseIndexMatchesLanguageCriteria,
} from './language-pair-scope.utils';
export { normalizeLanguageCode } from './language-code.utils';
export { getLanguageFlagEmoji } from './language-flag.utils';
export {
  getLanguageBadgeColor,
  getLanguageBadgeTextColor,
  getLanguageBadgeCode,
} from './language-badge.utils';
