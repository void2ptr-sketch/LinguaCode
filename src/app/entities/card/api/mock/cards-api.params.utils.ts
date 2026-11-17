import { HttpParams } from '@angular/common/http';

import type {
  CardSearchCriteria,
  CardSearchScope,
  CardKind,
  ContentLanguage,
  CardDifficulty,
} from '../../model';
import { DEFAULT_PAGE_SIZE } from '../../../../shared/utils/pagination';

/** Maps a frontend card kind to the uppercase backend enum value. */
const CARD_KIND_TO_BACKEND: Record<CardKind, string> = {
  select: 'SELECT',
  'code-select': 'CODE_SELECT',
  memory: 'MEMORY',
  symbol: 'SYMBOL',
  sound: 'SOUND',
  timed: 'TIMED',
  keyboard: 'KEYBOARD',
  draw: 'DRAW',
  tone: 'TONE',
  reading: 'READING',
  flip: 'FLIP',
  cloze: 'CLOZE',
  'code-trace': 'CODE_TRACE',
};

/** Maps an uppercase backend card kind to the frontend lowercase value. */
const CARD_KIND_FROM_BACKEND: Record<string, CardKind> = Object.fromEntries(
  Object.entries(CARD_KIND_TO_BACKEND).map(([frontend, backend]) => [backend, frontend]),
) as Record<string, CardKind>;

/**
 * Builds `HttpParams` from a `CardSearchCriteria` object.
 *
 * Serialises all non-empty criteria fields (query, languages, difficulty,
 * hierarchy IDs, kinds, tags, publication scope, pagination) into query
 * parameters. Enum values are converted to the uppercase backend format.
 *
 * @param criteria - The search criteria to serialise.
 * @returns An `HttpParams` instance ready for HTTP requests.
 */
export function buildCardSearchParams(criteria: CardSearchCriteria): HttpParams {
  let params = new HttpParams()
    .set('page', String(criteria.page.page))
    .set('pageSize', String(criteria.page.pageSize));

  if (criteria.query) {
    params = params.set('query', criteria.query);
  }

  if (criteria.knownLanguage) {
    params = params.set('knownLanguage', criteria.knownLanguage);
  }

  if (criteria.learningLanguage) {
    params = params.set('learningLanguage', criteria.learningLanguage);
  }

  if (criteria.languagePairId) {
    params = params.set('languagePairId', criteria.languagePairId);
  }

  if (criteria.difficulty) {
    params = params.set('difficulty', criteria.difficulty.toUpperCase());
  }

  if (criteria.courseId) {
    params = params.set('courseId', criteria.courseId);
  }

  if (criteria.programId) {
    params = params.set('programId', criteria.programId);
  }

  if (criteria.lessonId) {
    params = params.set('lessonId', criteria.lessonId);
  }

  if (criteria.scenarioId) {
    params = params.set('scenarioId', criteria.scenarioId);
  }

  if (criteria.published !== undefined) {
    params = params.set('published', String(criteria.published));
  }

  if (criteria.scope) {
    params = params.set('scope', criteria.scope);
  }

  for (const kind of criteria.kinds ?? []) {
    params = params.append('kinds', CARD_KIND_TO_BACKEND[kind]);
  }

  for (const tag of criteria.tags ?? []) {
    params = params.append('tags', tag);
  }

  return params;
}

/**
 * Parses `HttpParams` back into a `CardSearchCriteria` object.
 *
 * Extracts and type-coerces query parameters (kinds, tags, languages,
 * difficulty, IDs, pagination) into a structured criteria object.
 *
 * @param params - The HTTP parameters to parse.
 * @returns A `CardSearchCriteria` object populated from the parameters.
 */
export function parseCardSearchCriteria(params: HttpParams): CardSearchCriteria {
  const kinds = (params.getAll('kinds') ?? [])
    .map((kind) => CARD_KIND_FROM_BACKEND[kind.toUpperCase()])
    .filter((kind): kind is CardKind => kind !== undefined);
  const tags = params.getAll('tags') ?? [];
  const difficulty = params.get('difficulty')?.toLowerCase() as CardDifficulty | undefined;
  const publishedRaw = params.get('published');
  const scope = (params.get('scope') as CardSearchScope | null) ?? undefined;

  return {
    query: params.get('query') ?? undefined,
    knownLanguage: (params.get('knownLanguage') as ContentLanguage | null) ?? undefined,
    learningLanguage: (params.get('learningLanguage') as ContentLanguage | null) ?? undefined,
    languagePairId: params.get('languagePairId') ?? undefined,
    difficulty,
    courseId: params.get('courseId') ?? undefined,
    programId: params.get('programId') ?? undefined,
    lessonId: params.get('lessonId') ?? undefined,
    scenarioId: params.get('scenarioId') ?? undefined,
    published: publishedRaw === null ? undefined : publishedRaw === 'true',
    scope,
    kinds: kinds.length > 0 ? kinds : undefined,
    tags: tags.length > 0 ? tags : undefined,
    page: {
      page: Number(params.get('page') ?? 0),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    },
  };
}
