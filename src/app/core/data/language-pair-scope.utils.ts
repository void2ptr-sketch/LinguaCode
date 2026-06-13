import type { LanguagePair } from '../models';
import type { ScenarioIndexEntry } from '../models/scenario-index.types';
import type { ScenarioSearchCriteria } from '../models/scenario-index.types';
import { formatLanguagePair } from './language-pair.utils';

export function activeLanguagePairCriteria(
  pair: LanguagePair,
): Pick<ScenarioSearchCriteria, 'knownLanguage' | 'learningLanguage'> {
  return { knownLanguage: pair.known, learningLanguage: pair.learning };
}

export function scenarioIndexMatchesLanguagePair(
  entry: Pick<ScenarioIndexEntry, 'languagePairSummary'>,
  pair: LanguagePair,
): boolean {
  if (!entry.languagePairSummary) {
    return false;
  }

  return entry.languagePairSummary === formatLanguagePair(pair);
}

export function scenarioIndexMatchesLanguageCriteria(
  entry: Pick<ScenarioIndexEntry, 'languagePairSummary'>,
  knownLanguage?: LanguagePair['known'],
  learningLanguage?: LanguagePair['learning'],
): boolean {
  if (!knownLanguage || !learningLanguage) {
    return true;
  }

  return scenarioIndexMatchesLanguagePair(entry, { known: knownLanguage, learning: learningLanguage });
}
