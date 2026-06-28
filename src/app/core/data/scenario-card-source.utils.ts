import type {
  CardIndexEntry,
  CardSearchCriteria,
  LanguagePair,
  Scenario,
  ScenarioCardSource,
  ScenarioCardSort,
} from '../models';
import type { LegacyScenario } from '../models/scenario.types';
import { normalizeLanguagePair } from './language-pair.utils';

import { matchesCardIndexEntry } from './card-search.utils';
import type { CardSearchService } from './card-search.service';

export const DEFAULT_CRITERIA_LIMIT = 50;

const DIFFICULTY_ORDER = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
} as const;

export function emptyCardSearchCriteria(): Omit<CardSearchCriteria, 'page'> {
  return {};
}

export function hasCardSearchFilters(criteria: Omit<CardSearchCriteria, 'page'>): boolean {
  return Boolean(
    criteria.query?.trim() ||
    criteria.knownLanguage ||
    criteria.learningLanguage ||
    criteria.difficulty ||
    (criteria.kinds?.length ?? 0) > 0 ||
    (criteria.tags?.length ?? 0) > 0,
  );
}

export function scenarioUsesCardId(source: ScenarioCardSource, cardId: string): boolean {
  if (source.mode === 'fixed' || source.mode === 'snapshot') {
    return source.cardIds.includes(cardId);
  }

  return false;
}

export function scenarioUsesCardEntry(source: ScenarioCardSource, entry: CardIndexEntry): boolean {
  if (source.mode === 'fixed' || source.mode === 'snapshot') {
    return source.cardIds.includes(entry.id);
  }

  return matchesCardIndexEntry(entry, source.criteria);
}

export function scenarioCardsLabel(source: ScenarioCardSource): string {
  if (source.mode === 'fixed') {
    return `${source.cardIds.length} карточек`;
  }

  if (source.mode === 'snapshot') {
    return `${source.cardIds.length} карточек (snapshot)`;
  }

  return `до ${source.limit ?? DEFAULT_CRITERIA_LIMIT} по критериям`;
}

export function normalizeScenario(raw: LegacyScenario): Scenario {
  const base = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    authorId: raw.authorId,
    published: raw.published ?? false,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    languagePair: raw.languagePair ? normalizeLanguagePair(raw.languagePair) : undefined,
    courseId: raw.courseId,
  };

  if (raw.cardSource) {
    return {
      ...base,
      cardSource: raw.cardSource,
    };
  }

  return {
    ...base,
    cardSource: {
      mode: 'fixed',
      cardIds: raw.cardIds ?? [],
    },
  };
}

export function scenarioMatchesLanguagePair(
  scenario: Pick<Scenario, 'languagePair'>,
  pair: LanguagePair,
): boolean {
  if (!scenario.languagePair) {
    return false;
  }

  return (
    scenario.languagePair.known === pair.known && scenario.languagePair.learning === pair.learning
  );
}

export async function resolveScenarioCardIds(
  source: ScenarioCardSource,
  cardSearchService: CardSearchService,
): Promise<readonly string[]> {
  if (source.mode === 'fixed' || source.mode === 'snapshot') {
    return source.cardIds;
  }

  const limit = source.limit ?? DEFAULT_CRITERIA_LIMIT;
  const page = await cardSearchService.search({
    ...source.criteria,
    page: { page: 0, pageSize: limit },
  });

  const sorted = sortCardIndexEntries(page.items, source.sort ?? 'updatedAt', source.seed);
  return sorted.map((entry) => entry.id);
}

export function sortCardIndexEntries(
  entries: readonly CardIndexEntry[],
  sort: ScenarioCardSort,
  seed?: string,
): readonly CardIndexEntry[] {
  const sorted = [...entries];

  if (sort === 'updatedAt') {
    return sorted.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  if (sort === 'difficulty') {
    return sorted.sort(
      (left, right) => DIFFICULTY_ORDER[left.difficulty] - DIFFICULTY_ORDER[right.difficulty],
    );
  }

  return seededShuffle(sorted, seed ?? 'lingua-code');
}

function seededShuffle<T>(items: readonly T[], seed: string): readonly T[] {
  const random = mulberry32(hashSeed(seed));
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ScenarioCardSourceValidationError = {
  field: 'cardSource';
  message: string;
};

export async function validateScenarioCardSource(
  source: ScenarioCardSource,
  cardExists: (cardId: string) => Promise<boolean>,
): Promise<ScenarioCardSourceValidationError | null> {
  if (source.mode === 'fixed' || source.mode === 'snapshot') {
    if (source.cardIds.length === 0) {
      return { field: 'cardSource', message: 'Выберите хотя бы одну карточку' };
    }

    for (const cardId of source.cardIds) {
      if (!(await cardExists(cardId))) {
        return { field: 'cardSource', message: `Карточка не найдена: ${cardId}` };
      }
    }

    return null;
  }

  if (!hasCardSearchFilters(source.criteria)) {
    return { field: 'cardSource', message: 'Укажите хотя бы один критерий отбора карточек' };
  }

  const limit = source.limit ?? DEFAULT_CRITERIA_LIMIT;
  if (limit <= 0) {
    return { field: 'cardSource', message: 'Лимит карточек должен быть больше 0' };
  }

  return null;
}

export function buildSnapshotCardSource(
  cardIds: readonly string[],
  criteria: Omit<CardSearchCriteria, 'page'>,
  limit?: number,
): Extract<ScenarioCardSource, { mode: 'snapshot' }> {
  return {
    mode: 'snapshot',
    cardIds,
    criteria,
    limit,
    frozenAt: new Date().toISOString(),
  };
}
