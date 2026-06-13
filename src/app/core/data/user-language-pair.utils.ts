import type { LanguagePair } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';
import type { UserLanguagePairEntry, UserPreferences } from '../models/user.types';
import { isAllowedFontSize, sanitizeTheme } from '../security';
import { isContentLanguage, languagePairsEqual, normalizeLanguagePair } from './language-pair.utils';

type LegacyUserPreferences = Partial<UserPreferences> & {
  languagePair?: Partial<LanguagePair>;
};

const DEFAULT_THEME = 'azure-blue';
const DEFAULT_FONT_SIZE: UserPreferences['fontSize'] = 'md';

export function createUserLanguagePairEntry(
  pair?: Partial<LanguagePair> | null,
  id?: string,
  createdAt?: string,
): UserLanguagePairEntry {
  return {
    id: id ?? crypto.randomUUID(),
    pair: normalizeLanguagePair(pair),
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

export function createDefaultLanguagePairPreferences(): Pick<
  UserPreferences,
  'languagePairs' | 'activeLanguagePairId'
> {
  const entry = createUserLanguagePairEntry(DEFAULT_LANGUAGE_PAIR);

  return {
    languagePairs: [entry],
    activeLanguagePairId: entry.id,
  };
}

function normalizeLanguagePairEntry(raw: unknown): UserLanguagePairEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<UserLanguagePairEntry>;
  if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
    return null;
  }

  if (!candidate.pair || typeof candidate.pair !== 'object') {
    return null;
  }

  const pair = candidate.pair as Partial<LanguagePair>;
  if (!isContentLanguage(pair.known) || !isContentLanguage(pair.learning)) {
    return null;
  }

  if (pair.known === pair.learning) {
    return null;
  }

  return createUserLanguagePairEntry(
    { known: pair.known, learning: pair.learning },
    candidate.id,
    typeof candidate.createdAt === 'string' ? candidate.createdAt : undefined,
  );
}

function dedupeLanguagePairEntries(
  entries: readonly UserLanguagePairEntry[],
): UserLanguagePairEntry[] {
  const unique: UserLanguagePairEntry[] = [];

  for (const entry of entries) {
    if (unique.some((item) => languagePairsEqual(item.pair, entry.pair))) {
      continue;
    }

    unique.push(entry);
  }

  return unique;
}

export function normalizeUserPreferences(
  preferences?: LegacyUserPreferences | null,
): UserPreferences {
  const theme = sanitizeTheme(preferences?.theme ?? DEFAULT_THEME);
  const fontSize =
    preferences?.fontSize && isAllowedFontSize(preferences.fontSize)
      ? preferences.fontSize
      : DEFAULT_FONT_SIZE;

  const defaults = createDefaultLanguagePairPreferences();

  if (Array.isArray(preferences?.languagePairs)) {
    const normalizedEntries = dedupeLanguagePairEntries(
      preferences.languagePairs
        .map((entry) => normalizeLanguagePairEntry(entry))
        .filter((entry): entry is UserLanguagePairEntry => entry !== null),
    );

    if (normalizedEntries.length === 0) {
      return {
        theme,
        fontSize,
        ...defaults,
      };
    }

    const activeLanguagePairId =
      typeof preferences.activeLanguagePairId === 'string' &&
      normalizedEntries.some((entry) => entry.id === preferences.activeLanguagePairId)
        ? preferences.activeLanguagePairId
        : normalizedEntries[0].id;

    return {
      theme,
      fontSize,
      languagePairs: normalizedEntries,
      activeLanguagePairId,
    };
  }

  if (preferences?.languagePair) {
    const entry = createUserLanguagePairEntry(preferences.languagePair);

    return {
      theme,
      fontSize,
      languagePairs: [entry],
      activeLanguagePairId: entry.id,
    };
  }

  return {
    theme,
    fontSize,
    ...defaults,
  };
}

export function findLanguagePairEntryId(
  entries: readonly UserLanguagePairEntry[],
  pair: LanguagePair,
): string | null {
  return entries.find((entry) => languagePairsEqual(entry.pair, pair))?.id ?? null;
}
