import {
  DEFAULT_CRITERIA_LIMIT,
  emptyCardSearchCriteria,
} from '../../../entities/scenario/utils/scenario-card-source.utils';
import type { Scenario } from '../../../entities/scenario/model';
import type { ScenarioCardSource, ScenarioCardSort } from '../../../entities/card/model';
import type { ScenarioCardSourceMode, ScenarioCriteriaDraft, ScenarioDraft } from '../types';

export type ScenarioFormDraft = {
  title: string;
  description: string;
  published: boolean;
  /** Numeric language pair ID from `language_pairs.id`. */
  languagePairId?: number;
  courseId?: string;
  programId?: string;
  lessonId?: string;
  requiredTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Позиция сценария внутри урока (UI-слой). */
  scenarioOrder?: number;
  sourceMode: ScenarioCardSourceMode;
  fixedCardIds: readonly string[];
  criteria: ScenarioCriteriaDraft;
  criteriaLimit: number;
  criteriaSort: ScenarioCardSort;
  criteriaSeed: string;
  snapshotFrozenAt: string | null;
};

export function emptyScenarioFormDraft(
  initialOrder = 1,
): ScenarioFormDraft {
  return {
    title: '',
    description: '',
    published: false,
    requiredTier: 'FREE',
    scenarioOrder: initialOrder,
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
    languagePairId: scenario.languagePairId,
    courseId: scenario.courseId,
    programId: scenario.programId,
    lessonId: scenario.lessonId,
    requiredTier: scenario.requiredTier ?? 'FREE',
    scenarioOrder: scenario.order ?? 0,
  };
}

export function formDraftToScenarioDraft(form: ScenarioFormDraft): ScenarioDraft {
  return {
    title: form.title,
    description: form.description,
    published: form.published,
    languagePairId: form.languagePairId,
    cardSource: buildCardSource(form),
    courseId: form.courseId,
    programId: form.programId,
    lessonId: form.lessonId,
    requiredTier: form.requiredTier,
    order: form.scenarioOrder,
  };
}

export function serializeScenarioFormDraft(form: ScenarioFormDraft): string {
  return JSON.stringify({
    ...form,
    criteria: { ...form.criteria },
    fixedCardIds: [...form.fixedCardIds],
  });
}

function cardSourceToFormFields(
  source: ScenarioCardSource,
): Omit<ScenarioFormDraft, 'title' | 'description' | 'published' | 'languagePairId'> {
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
