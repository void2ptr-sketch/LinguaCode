import {
  LEGACY_CARD_INDEX_META_KEY,
  LEGACY_CARDS_KEY,
  LEGACY_COURSE_CATALOG_KEY,
  LEGACY_SCENARIOS_KEY,
  USER_CONTENT_MIGRATED_KEY,
} from './user-content-overlay.types';
import type { Course, Scenario } from '../../../models';
import { migrateUserContentOverlayIfNeeded } from './user-content-overlay.migration';
import { setCourseSeedCache, setScenarioSeedCache } from '../../content-seed/content-seed.cache';
import { emptyUserContentOverlay } from './user-content-overlay.storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearLocalStorage(): void {
  localStorage.clear();
}

function seedEmptyCache(): void {
  setCourseSeedCache({ courses: [], lessons: [] });
  setScenarioSeedCache([]);
}

// ---------------------------------------------------------------------------
// migrateUserContentOverlayIfNeeded
// ---------------------------------------------------------------------------

describe('migrateUserContentOverlayIfNeeded', () => {
  beforeEach(() => {
    clearLocalStorage();
    seedEmptyCache();
  });

  it('returns early when migration flag is already set', () => {
    localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
  });

  it('returns early when seed data is empty', () => {
    // seed is already empty from seedEmptyCache
    migrateUserContentOverlayIfNeeded();

    // Should not throw and flag should not be set
    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBeNull();
  });

  it('sets migration flag when overlay already has content and no legacy data', () => {
    const overlay = emptyUserContentOverlay();
    overlay.courses['existing-course'] = { id: 'existing-course', title: 'Existing' } as Course;
    localStorage.setItem('lingua-code.user-content.v1', JSON.stringify(overlay));

    // Provide seed data so the early-return guard doesn't trigger
    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
  });

  it('migrates legacy course catalog when present', () => {
    const legacyCatalog = JSON.stringify({
      courses: [{ id: 'legacy-course', title: 'Legacy', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    localStorage.setItem(LEGACY_COURSE_CATALOG_KEY, legacyCatalog);

    // Provide minimal seed to pass the early-return check
    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
    expect(localStorage.getItem(LEGACY_COURSE_CATALOG_KEY)).toBeNull();
  });

  it('migrates legacy scenarios when present', () => {
    const legacyScenarios = JSON.stringify([
      { id: 'legacy-scenario', title: 'Legacy', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed', cardIds: [] } },
    ]);
    localStorage.setItem(LEGACY_SCENARIOS_KEY, legacyScenarios);

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
    expect(localStorage.getItem(LEGACY_SCENARIOS_KEY)).toBeNull();
  });

  it('migrates legacy cards when present', () => {
    const legacyCards = JSON.stringify([
      { id: 'legacy-card', kind: 'select', promptKnown: 'Hello', optionsLearning: ['Привет'], correctIndex: 0, direction: 'known-to-learning' },
    ]);
    localStorage.setItem(LEGACY_CARDS_KEY, legacyCards);

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
    expect(localStorage.getItem(LEGACY_CARDS_KEY)).toBeNull();
  });

  it('migrates legacy card index meta when present', () => {
    const legacyMeta = JSON.stringify({ 'card-1': { difficulty: 'hard' } });
    localStorage.setItem(LEGACY_CARD_INDEX_META_KEY, legacyMeta);

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
    expect(localStorage.getItem(LEGACY_CARD_INDEX_META_KEY)).toBeNull();
  });

  it('handles invalid JSON gracefully for course catalog', () => {
    localStorage.setItem(LEGACY_COURSE_CATALOG_KEY, 'not-valid-json');

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    expect(() => migrateUserContentOverlayIfNeeded()).not.toThrow();
    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
  });

  it('handles invalid JSON gracefully for scenarios', () => {
    localStorage.setItem(LEGACY_SCENARIOS_KEY, 'not-valid-json');

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    expect(() => migrateUserContentOverlayIfNeeded()).not.toThrow();
    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
  });

  it('cleans up all legacy keys after migration', () => {
    localStorage.setItem(LEGACY_COURSE_CATALOG_KEY, '{}');
    localStorage.setItem(LEGACY_SCENARIOS_KEY, '[]');
    localStorage.setItem(LEGACY_CARDS_KEY, '[]');
    localStorage.setItem(LEGACY_CARD_INDEX_META_KEY, '{}');

    setCourseSeedCache({
      courses: [{ id: 'seed-course', title: 'Seed', description: 'Seed desc', lessonIds: [], authorId: 'user-1', languagePair: { known: 'en', learning: 'zh' }, published: true, updatedAt: '2026-01-01T00:00:00.000Z' }],
      lessons: [],
    });
    setScenarioSeedCache([{ id: 'seed-scenario', title: 'Seed', description: '', authorId: 'user-1', published: true, updatedAt: '2026-01-01T00:00:00.000Z', cardSource: { mode: 'fixed' as const, cardIds: [] } }] as Scenario[]);

    migrateUserContentOverlayIfNeeded();

    expect(localStorage.getItem(LEGACY_COURSE_CATALOG_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_SCENARIOS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_CARDS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_CARD_INDEX_META_KEY)).toBeNull();
    expect(localStorage.getItem(USER_CONTENT_MIGRATED_KEY)).toBe('1');
  });
});
