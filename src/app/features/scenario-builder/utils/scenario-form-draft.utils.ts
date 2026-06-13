import {
  DEFAULT_CRITERIA_LIMIT,
  emptyCardSearchCriteria,
} from '../../../core/data/scenario-card-source.utils';
import type { LanguagePair, Scenario, ScenarioCardSource, ScenarioCardSort } from '../../../core/models';
import { DEFAULT_LANGUAGE_PAIR } from '../../../core/models/language-pair.types';
import type { ScenarioCardSourceMode, ScenarioCriteriaDraft, ScenarioDraft } from '../types';

export type ScenarioFormDraft = {
  title: string;
  description: string;
  published: boolean;
  languagePair: LanguagePair;
  sourceMode: ScenarioCardSourceMode;
  fixedCardIds: readonly string[];
  criteria: ScenarioCriteriaDraft;
  criteriaLimit: number;
  criteriaSort: ScenarioCardSort;
  criteriaSeed: string;
  snapshotFrozenAt: string | null;
};

export function emptyScenarioFormDraft(languagePair: LanguagePair = DEFAULT_LANGUAGE_PAIR): ScenarioFormDraft {
  return {
    title: '',
    description: '',
    published: false,
    languagePair,
    sourceMode: 'fixed',
    fixedCardIds: [],
    criteria: emptyCardSearchCriteria(),
    criteriaLimit: DEFAULT_CRITERIA_LIMIT,
    criteriaSort: 'updatedAt',
    criteriaSeed: '',
    snapshotFrozenAt: null,
  };
}

export function scenarioToFormDraft(scenario: Scenario): ScenarioFormDraft {
  return {
    ...cardSourceToFormFields(scenario.cardSource),
    title: scenario.title,
    description: scenario.description,
    published: scenario.published,
    languagePair: scenario.languagePair ?? DEFAULT_LANGUAGE_PAIR,
  };
}

export function formDraftToScenarioDraft(form: ScenarioFormDraft): ScenarioDraft {
  return {
    title: form.title,
    description: form.description,
    published: form.published,
    languagePair: form.languagePair,
    cardSource: buildCardSource(form),
  };
}

export function serializeScenarioFormDraft(form: ScenarioFormDraft): string {
  return JSON.stringify(form);
}

function cardSourceToFormFields(
  source: ScenarioCardSource,
): Omit<ScenarioFormDraft, 'title' | 'description' | 'published' | 'languagePair'> {
  if (source.mode === 'fixed') {
    return {
      sourceMode: 'fixed',
      fixedCardIds: [...source.cardIds],
      criteria: emptyCardSearchCriteria(),
      criteriaLimit: DEFAULT_CRITERIA_LIMIT,
      criteriaSort: 'updatedAt',
      criteriaSeed: '',
      snapshotFrozenAt: null,
    };
  }

  if (source.mode === 'snapshot') {
    return {
      sourceMode: 'snapshot',
      fixedCardIds: [...source.cardIds],
      criteria: { ...source.criteria },
      criteriaLimit: source.limit ?? DEFAULT_CRITERIA_LIMIT,
      criteriaSort: 'updatedAt',
      criteriaSeed: '',
      snapshotFrozenAt: source.frozenAt,
    };
  }

  return {
    sourceMode: 'criteria',
    fixedCardIds: [],
    criteria: { ...source.criteria },
    criteriaLimit: source.limit ?? DEFAULT_CRITERIA_LIMIT,
    criteriaSort: source.sort ?? 'updatedAt',
    criteriaSeed: source.seed ?? '',
    snapshotFrozenAt: null,
  };
}

function buildCardSource(form: ScenarioFormDraft): ScenarioCardSource {
  if (form.sourceMode === 'fixed') {
    return { mode: 'fixed', cardIds: form.fixedCardIds };
  }

  if (form.sourceMode === 'snapshot') {
    return {
      mode: 'snapshot',
      cardIds: form.fixedCardIds,
      criteria: form.criteria,
      limit: form.criteriaLimit,
      frozenAt: form.snapshotFrozenAt ?? new Date().toISOString(),
    };
  }

  return {
    mode: 'criteria',
    criteria: form.criteria,
    limit: form.criteriaLimit,
    sort: form.criteriaSort,
    seed: form.criteriaSeed || undefined,
  };
}
