import { describe, it, expect } from 'vitest';
import type { LanguagePair, Scenario, ScenarioCardSource } from '../../../core/models';
import { DEFAULT_LANGUAGE_PAIR } from '../../../core/models/language-pair.types';
import {
  emptyScenarioFormDraft,
  scenarioToFormDraft,
  formDraftToScenarioDraft,
  serializeScenarioFormDraft,
  type ScenarioFormDraft,
} from './scenario-form-draft.utils';

type ScenarioWithCardSource = Scenario & { cardSource: ScenarioCardSource };

const RU_TO_EN: LanguagePair = { known: 'ru', learning: 'en' };
const EN_TO_RU: LanguagePair = { known: 'en', learning: 'ru' };

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

function buildFixedSource(cardIds: string[] = ['card-1', 'card-2']): Extract<
  ScenarioCardSource,
  { mode: 'fixed' }
> {
  return { mode: 'fixed', cardIds };
}

function buildSnapshotSource(
  cardIds: string[] = ['card-1'],
  frozenAt = '2025-01-01T00:00:00.000Z',
): Extract<ScenarioCardSource, { mode: 'snapshot' }> {
  return {
    mode: 'snapshot',
    cardIds,
    criteria: { query: 'test' },
    limit: 25,
    frozenAt,
  };
}

function buildCriteriaSource(): Extract<ScenarioCardSource, { mode: 'criteria' }> {
  return {
    mode: 'criteria',
    criteria: { query: 'search' },
    limit: 10,
    sort: 'difficulty',
    seed: 'my-seed',
  };
}

function buildScenario(overrides: Partial<ScenarioWithCardSource> = {}): ScenarioWithCardSource {
  return {
    id: 'scenario-1',
    title: 'Test Scenario',
    description: 'A test scenario',
    authorId: 'author-1',
    published: true,
    updatedAt: '2025-06-01T12:00:00.000Z',
    languagePair: RU_TO_EN,
    cardSource: buildFixedSource(),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests: emptyScenarioFormDraft                                      */
/* ------------------------------------------------------------------ */

describe('emptyScenarioFormDraft', () => {
  it('returns a draft with default languagePair when called without arguments', () => {
    const draft = emptyScenarioFormDraft();

    expect(draft).toEqual({
      title: '',
      description: '',
      published: false,
      languagePair: DEFAULT_LANGUAGE_PAIR,
      sourceMode: 'fixed',
      fixedCardIds: [],
      criteria: {},
      criteriaLimit: 50,
      criteriaSort: 'updatedAt',
      criteriaSeed: '',
      snapshotFrozenAt: null,
    });
  });

  it('accepts a custom languagePair', () => {
    const draft = emptyScenarioFormDraft(EN_TO_RU);

    expect(draft.languagePair).toBe(EN_TO_RU);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: scenarioToFormDraft                                         */
/* ------------------------------------------------------------------ */

describe('scenarioToFormDraft', () => {
  it('maps a fixed-source scenario correctly', () => {
    const scenario = buildScenario({
      cardSource: buildFixedSource(['a', 'b', 'c']),
    });

    const draft = scenarioToFormDraft(scenario);

    expect(draft.title).toBe('Test Scenario');
    expect(draft.description).toBe('A test scenario');
    expect(draft.published).toBe(true);
    expect(draft.languagePair).toBe(RU_TO_EN);
    expect(draft.sourceMode).toBe('fixed');
    expect(draft.fixedCardIds).toEqual(['a', 'b', 'c']);
    expect(draft.snapshotFrozenAt).toBeNull();
  });

  it('maps a snapshot-source scenario correctly', () => {
    const scenario = buildScenario({
      cardSource: buildSnapshotSource(['x', 'y'], '2024-12-25T00:00:00.000Z'),
    });

    const draft = scenarioToFormDraft(scenario);

    expect(draft.sourceMode).toBe('snapshot');
    expect(draft.fixedCardIds).toEqual(['x', 'y']);
    expect(draft.criteria).toEqual({ query: 'test' });
    expect(draft.criteriaLimit).toBe(25);
    expect(draft.snapshotFrozenAt).toBe('2024-12-25T00:00:00.000Z');
  });

  it('maps a criteria-source scenario correctly', () => {
    const scenario = buildScenario({
      cardSource: buildCriteriaSource(),
    });

    const draft = scenarioToFormDraft(scenario);

    expect(draft.sourceMode).toBe('criteria');
    expect(draft.fixedCardIds).toEqual([]);
    expect(draft.criteria).toEqual({ query: 'search' });
    expect(draft.criteriaLimit).toBe(10);
    expect(draft.criteriaSort).toBe('difficulty');
    expect(draft.criteriaSeed).toBe('my-seed');
    expect(draft.snapshotFrozenAt).toBeNull();
  });

  it('falls back to DEFAULT_LANGUAGE_PAIR when scenario.languagePair is undefined', () => {
    const scenario = buildScenario({ languagePair: undefined });

    const draft = scenarioToFormDraft(scenario);

    expect(draft.languagePair).toBe(DEFAULT_LANGUAGE_PAIR);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: formDraftToScenarioDraft                                    */
/* ------------------------------------------------------------------ */

describe('formDraftToScenarioDraft', () => {
  function baseDraft(overrides: Partial<ScenarioFormDraft> = {}): ScenarioFormDraft {
    return {
      title: 'Draft Title',
      description: 'Draft Description',
      published: true,
      languagePair: RU_TO_EN,
      sourceMode: 'fixed',
      fixedCardIds: [],
      criteria: {},
      criteriaLimit: 50,
      criteriaSort: 'updatedAt',
      criteriaSeed: '',
      snapshotFrozenAt: null,
      ...overrides,
    };
  }

  it('builds a fixed card source from a fixed-mode draft', () => {
    const draft = baseDraft({
      sourceMode: 'fixed',
      fixedCardIds: ['id-1', 'id-2'],
    });

    const result = formDraftToScenarioDraft(draft);

    expect(result).toEqual({
      title: 'Draft Title',
      description: 'Draft Description',
      published: true,
      languagePair: RU_TO_EN,
      cardSource: { mode: 'fixed', cardIds: ['id-1', 'id-2'] },
    });
  });

  it('builds a snapshot card source from a snapshot-mode draft', () => {
    const draft = baseDraft({
      sourceMode: 'snapshot',
      fixedCardIds: ['snap-1'],
      criteria: { kinds: ['select'] },
      criteriaLimit: 30,
      snapshotFrozenAt: '2025-03-15T10:00:00.000Z',
    });

    const result = formDraftToScenarioDraft(draft);

    expect(result.cardSource).toMatchObject({
      mode: 'snapshot',
      cardIds: ['snap-1'],
      criteria: { kinds: ['select'] },
      limit: 30,
    });

    // frozenAt should be present and equal to snapshotFrozenAt
    const snapshotSource = result.cardSource as Extract<ScenarioCardSource, { mode: 'snapshot' }>;
    expect(snapshotSource.frozenAt).toBe('2025-03-15T10:00:00.000Z');
  });

  it('uses current ISO timestamp as frozenAt when snapshotFrozenAt is null', () => {
    const before = Date.now();
    const draft = baseDraft({
      sourceMode: 'snapshot',
      fixedCardIds: ['a'],
      snapshotFrozenAt: null,
    });

    const result = formDraftToScenarioDraft(draft);
    const after = Date.now();

    const snapshotSource = result.cardSource as Extract<ScenarioCardSource, { mode: 'snapshot' }>;
    const frozenAtMs = new Date(snapshotSource.frozenAt!).getTime();

    expect(frozenAtMs).toBeGreaterThanOrEqual(before);
    expect(frozenAtMs).toBeLessThanOrEqual(after);
  });

  it('builds a criteria card source from a criteria-mode draft', () => {
    const draft = baseDraft({
      sourceMode: 'criteria',
      criteria: { difficulty: 'intermediate' },
      criteriaLimit: 15,
      criteriaSort: 'random',
      criteriaSeed: 'abc',
    });

    const result = formDraftToScenarioDraft(draft);

    expect(result.cardSource).toEqual({
      mode: 'criteria',
      criteria: { difficulty: 'intermediate' },
      limit: 15,
      sort: 'random',
      seed: 'abc',
    });
  });

  it('omits seed when criteriaSeed is empty string', () => {
    const draft = baseDraft({
      sourceMode: 'criteria',
      criteriaSeed: '',
    });

    const result = formDraftToScenarioDraft(draft);

    expect((result.cardSource as Extract<ScenarioCardSource, { mode: 'criteria' }>).seed)
      .toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: serializeScenarioFormDraft                                  */
/* ------------------------------------------------------------------ */

describe('serializeScenarioFormDraft', () => {
  it('serializes a form draft to a JSON string', () => {
    const draft: ScenarioFormDraft = {
      title: 'Serialize Me',
      description: 'desc',
      published: false,
      languagePair: EN_TO_RU,
      sourceMode: 'fixed',
      fixedCardIds: ['s1'],
      criteria: {},
      criteriaLimit: 50,
      criteriaSort: 'updatedAt',
      criteriaSeed: '',
      snapshotFrozenAt: null,
    };

    const serialized = serializeScenarioFormDraft(draft);

    expect(typeof serialized).toBe('string');
    expect(serialized).toContain('"title":"Serialize Me"');
  });

  it('supports round-trip serialization and parsing', () => {
    const draft: ScenarioFormDraft = {
      title: 'Round Trip',
      description: 'deep desc',
      published: true,
      languagePair: RU_TO_EN,
      sourceMode: 'criteria',
      fixedCardIds: [],
      criteria: { query: 'round', difficulty: 'beginner' },
      criteriaLimit: 20,
      criteriaSort: 'difficulty',
      criteriaSeed: 'rt-seed',
      snapshotFrozenAt: null,
    };

    const serialized = serializeScenarioFormDraft(draft);
    const parsed = JSON.parse(serialized) as ScenarioFormDraft;

    expect(parsed).toEqual(draft);
  });
});
