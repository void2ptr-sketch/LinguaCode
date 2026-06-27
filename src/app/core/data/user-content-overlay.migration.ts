import type { Card } from '../models';
import type { LegacyScenario } from '../models/scenario.types';

import { getCardSeedCache, getCourseSeedCache, getScenarioSeedCache } from './content-seed.cache';
import type { CourseCatalogState } from './course-catalog-state';
import { normalizeStoredCourseCatalog } from './course-catalog-state';
import { normalizeLegacyCards } from './card-legacy.mapper';
import { normalizeScenario } from './scenario-card-source.utils';
import {
  computeCardsOverlay,
  computeCourseCatalogOverlay,
  computeScenariosOverlay,
  mergeLegacyCourseCatalogWithSeed,
  mergeLegacyScenariosWithSeed,
} from './user-content-overlay.resolver';
import {
  LEGACY_CARD_INDEX_META_KEY,
  LEGACY_CARDS_KEY,
  LEGACY_COURSE_CATALOG_KEY,
  LEGACY_SCENARIOS_KEY,
  USER_CONTENT_MIGRATED_KEY,
} from './user-content-overlay.types';
import { readUserContentOverlay, writeUserContentOverlay } from './user-content-overlay.storage';

export function migrateUserContentOverlayIfNeeded(): void {
  if (localStorage.getItem(USER_CONTENT_MIGRATED_KEY) === '1') {
    return;
  }

  const seedCourses = getCourseSeedCache();
  const seedScenarios = getScenarioSeedCache();
  const seedCards = getCardSeedCache();

  if (seedCourses.courses.length === 0 || seedScenarios.length === 0) {
    return;
  }

  let overlay = readUserContentOverlay();
  const hasLegacyData =
    localStorage.getItem(LEGACY_COURSE_CATALOG_KEY) !== null ||
    localStorage.getItem(LEGACY_SCENARIOS_KEY) !== null ||
    localStorage.getItem(LEGACY_CARDS_KEY) !== null ||
    localStorage.getItem(LEGACY_CARD_INDEX_META_KEY) !== null;

  if (!hasLegacyData && hasOverlayContent(overlay)) {
    localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');
    return;
  }

  if (localStorage.getItem(LEGACY_COURSE_CATALOG_KEY)) {
    const legacyCatalog = readLegacyCourseCatalog();
    const merged = mergeLegacyCourseCatalogWithSeed(legacyCatalog, seedCourses);
    overlay = {
      ...overlay,
      ...computeCourseCatalogOverlay(merged, seedCourses, overlay),
    };
  }

  if (localStorage.getItem(LEGACY_SCENARIOS_KEY)) {
    const legacyScenarios = readLegacyScenarios();
    const merged = mergeLegacyScenariosWithSeed(legacyScenarios, seedScenarios);
    overlay = {
      ...overlay,
      ...computeScenariosOverlay(merged, seedScenarios, overlay),
    };
  }

  if (localStorage.getItem(LEGACY_CARDS_KEY)) {
    const legacyCards = readLegacyCards();
    overlay = {
      ...overlay,
      ...computeCardsOverlay(legacyCards, seedCards, overlay),
    };
  }

  if (localStorage.getItem(LEGACY_CARD_INDEX_META_KEY)) {
    overlay = {
      ...overlay,
      cardIndexMeta: {
        ...overlay.cardIndexMeta,
        ...readLegacyCardIndexMeta(),
      },
    };
  }

  writeUserContentOverlay(overlay);

  localStorage.removeItem(LEGACY_COURSE_CATALOG_KEY);
  localStorage.removeItem(LEGACY_SCENARIOS_KEY);
  localStorage.removeItem(LEGACY_CARDS_KEY);
  localStorage.removeItem(LEGACY_CARD_INDEX_META_KEY);
  localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');
}

function hasOverlayContent(overlay: ReturnType<typeof readUserContentOverlay>): boolean {
  return (
    Object.keys(overlay.courses).length > 0 ||
    Object.keys(overlay.lessons).length > 0 ||
    Object.keys(overlay.scenarios).length > 0 ||
    Object.keys(overlay.cards).length > 0 ||
    Object.keys(overlay.cardIndexMeta).length > 0 ||
    Boolean(
      overlay.deletedSystemIds?.courses?.length ||
        overlay.deletedSystemIds?.lessons?.length ||
        overlay.deletedSystemIds?.scenarios?.length ||
        overlay.deletedSystemIds?.cards?.length,
    )
  );
}

function readLegacyCourseCatalog(): CourseCatalogState {
  const raw = localStorage.getItem(LEGACY_COURSE_CATALOG_KEY);
  if (!raw) {
    return { courses: [], lessons: [] };
  }

  try {
    return normalizeStoredCourseCatalog(JSON.parse(raw) as CourseCatalogState);
  } catch {
    return { courses: [], lessons: [] };
  }
}

function readLegacyScenarios(): readonly import('../models').Scenario[] {
  const raw = localStorage.getItem(LEGACY_SCENARIOS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as readonly LegacyScenario[];
    return Array.isArray(parsed) ? parsed.map(normalizeScenario) : [];
  } catch {
    return [];
  }
}

function readLegacyCards(): readonly Card[] {
  const raw = localStorage.getItem(LEGACY_CARDS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as readonly Card[];
    return Array.isArray(parsed) ? normalizeLegacyCards(parsed) : [];
  } catch {
    return [];
  }
}

function readLegacyCardIndexMeta(): Record<string, import('./card-index.mapper').CardIndexMetaOverride> {
  const raw = localStorage.getItem(LEGACY_CARD_INDEX_META_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, import('./card-index.mapper').CardIndexMetaOverride>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
