import type { LanguagePair } from '../../models';
import type { CourseIndexEntry } from '../../models/course-index.types';
import type { ScenarioIndexEntry } from '../../models/scenario-index.types';
import type { ScenarioSearchCriteria } from '../../models/scenario-index.types';
import { formatLanguagePair } from './language-pair.utils';

/**
 * Builds a scenario search criteria object from a language pair.
 *
 * @param pair — Language pair to convert.
 * @returns Criteria object with `knownLanguage` and `learningLanguage` set from the pair.
 */
export function activeLanguagePairCriteria(
  pair: LanguagePair,
): Pick<ScenarioSearchCriteria, 'knownLanguage' | 'learningLanguage'> {
  return { knownLanguage: pair.known, learningLanguage: pair.learning };
}

/**
 * Checks whether a scenario index entry matches the given language pair.
 *
 * Returns `false` when the entry has no `languagePairSummary`.
 *
 * @param entry — Scenario index entry to check.
 * @param pair — Language pair to compare against.
 * @returns `true` if the entry's language pair summary matches.
 */
export function scenarioIndexMatchesLanguagePair(
  entry: Pick<ScenarioIndexEntry, 'languagePairSummary'>,
  pair: LanguagePair,
): boolean {
  if (!entry.languagePairSummary) {
    return false;
  }

  return entry.languagePairSummary === formatLanguagePair(pair);
}

/**
 * Checks whether a course index entry matches the given language pair.
 *
 * @param entry — Course index entry to check.
 * @param pair — Language pair to compare against.
 * @returns `true` if the entry's language pair summary matches.
 */
export function courseIndexMatchesLanguagePair(
  entry: Pick<CourseIndexEntry, 'languagePairSummary'>,
  pair: LanguagePair,
): boolean {
  return entry.languagePairSummary === formatLanguagePair(pair);
}

/**
 * Checks whether a scenario index entry matches the given language criteria.
 *
 * When either `knownLanguage` or `learningLanguage` is omitted, returns `true`
 * to allow the entry to match any pair.
 *
 * @param entry — Scenario index entry to check.
 * @param knownLanguage — Known (source) language to match.
 * @param learningLanguage — Target (learning) language to match.
 * @returns `true` if the entry matches or criteria are incomplete.
 */
export function scenarioIndexMatchesLanguageCriteria(
  entry: Pick<ScenarioIndexEntry, 'languagePairSummary'>,
  knownLanguage?: LanguagePair['known'],
  learningLanguage?: LanguagePair['learning'],
): boolean {
  if (!knownLanguage || !learningLanguage) {
    return true;
  }

  return scenarioIndexMatchesLanguagePair(entry, {
    known: knownLanguage,
    learning: learningLanguage,
  });
}

/**
 * Checks whether a course index entry matches the given language criteria.
 *
 * When either `knownLanguage` or `learningLanguage` is omitted, returns `true`
 * to allow the entry to match any pair.
 *
 * @param entry — Course index entry to check.
 * @param knownLanguage — Known (source) language to match.
 * @param learningLanguage — Target (learning) language to match.
 * @returns `true` if the entry matches or criteria are incomplete.
 */
export function courseIndexMatchesLanguageCriteria(
  entry: Pick<CourseIndexEntry, 'languagePairSummary'>,
  knownLanguage?: LanguagePair['known'],
  learningLanguage?: LanguagePair['learning'],
): boolean {
  if (!knownLanguage || !learningLanguage) {
    return true;
  }

  return courseIndexMatchesLanguagePair(entry, {
    known: knownLanguage,
    learning: learningLanguage,
  });
}
