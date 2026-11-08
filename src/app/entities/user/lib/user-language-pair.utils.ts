import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import { DEFAULT_LANGUAGE_PAIR } from '../../language-pair/model/language-pair.types';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from '../../phonetic/model';
import type { CjkLearningPreferences, PhoneticPreferences } from '../../phonetic/model';
import type { UserLanguagePairEntry, UserLanguagePairSettings, UserPreferences } from '../model';
import { isAllowedFontSize, sanitizeTheme } from '../../../shared/security';
import { normalizeColorScheme } from './app-color-scheme.utils';
import { normalizeCardFocusFullscreen } from '../../card/utils/card-focus-preference.utils';
import { normalizeLearningProficiencyLevel } from '../../learning/lib/learning-proficiency.utils';
import {
  buildMirrorGroupKey,
  isContentLanguage,
  languagePairsEqual,
  normalizeLanguagePair,
} from '../../language-pair/lib/language-pair.utils';
import {
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  pairSupportsPhoneticDisplay,
  shouldShowPalladius,
} from '../../phonetic/lib/phonetic-preferences.utils';
import { normalizeLearningSessionPreferences } from '../../learning/lib/learning-session.utils';
type LegacyUserPreferences = Partial<UserPreferences> & {
  languagePair?: Partial<LanguagePair>;
  cjkLearning?: Partial<CjkLearningPreferences>;
  phonetic?: Partial<PhoneticPreferences>;
  /** @deprecated renamed to `learningProficiencyLevel` */
  chineseProficiencyLevel?: UserPreferences['learningProficiencyLevel'];
};

const DEFAULT_THEME = 'azure-blue';
const DEFAULT_FONT_SIZE: UserPreferences['fontSize'] = 'md';

export function defaultSettingsForPair(pair: LanguagePair): UserLanguagePairSettings | undefined {
  const settings: UserLanguagePairSettings = {};
  let hasAny = false;

  if (shouldShowPalladius(pair.known, pair.learning)) {
    settings.cjkLearning = { ...DEFAULT_CJK_LEARNING_PREFERENCES };
    hasAny = true;
  }

  if (pairSupportsPhoneticDisplay(pair.learning)) {
    settings.phonetic = { ...DEFAULT_PHONETIC_PREFERENCES };
    hasAny = true;
  }

  return hasAny ? settings : undefined;
}

export function resolveCjkLearningForPair(
  entry: UserLanguagePairEntry | null | undefined,
): CjkLearningPreferences {
  if (!entry) {
    return { ...DEFAULT_CJK_LEARNING_PREFERENCES };
  }

  const hasFullCjkCourse = shouldShowPalladius(entry.pair.known, entry.pair.learning);
  const hasZhTracing = entry.pair.learning === 'zh';

  if (!hasFullCjkCourse && !hasZhTracing) {
    return { ...DEFAULT_CJK_LEARNING_PREFERENCES };
  }

  if (hasFullCjkCourse) {
    return normalizeCjkLearningPreferences(entry.settings?.cjkLearning);
  }

  return normalizeCjkLearningPreferences({
    tracingStrokeDurationSec: entry.settings?.cjkLearning?.tracingStrokeDurationSec,
  });
}

export function resolvePhoneticForPair(
  entry: UserLanguagePairEntry | null | undefined,
): PhoneticPreferences {
  if (!entry || !pairSupportsPhoneticDisplay(entry.pair.learning)) {
    return { ...DEFAULT_PHONETIC_PREFERENCES };
  }

  return normalizePhoneticPreferences(entry.settings?.phonetic);
}

export { resolveLearningSessionForPair } from '../../learning/lib/learning-session.utils';

function normalizeEntrySettings(
  pair: LanguagePair,
  rawSettings?: Partial<UserLanguagePairSettings> | null,
  legacy?: {
    cjkLearning?: Partial<CjkLearningPreferences> | null;
    phonetic?: Partial<PhoneticPreferences> | null;
  },
): UserLanguagePairSettings | undefined {
  const settings: UserLanguagePairSettings = {};
  let hasAny = false;

  if (shouldShowPalladius(pair.known, pair.learning)) {
    settings.cjkLearning = normalizeCjkLearningPreferences({
      ...legacy?.cjkLearning,
      ...rawSettings?.cjkLearning,
    });
    hasAny = true;
  }

  if (pairSupportsPhoneticDisplay(pair.learning)) {
    settings.phonetic = normalizePhoneticPreferences({
      ...legacy?.phonetic,
      ...rawSettings?.phonetic,
    });
    hasAny = true;
  }

  const learning = normalizeLearningSessionPreferences(rawSettings?.learning);
  if (learning) {
    settings.learning = learning;
    hasAny = true;
  }

  return hasAny ? settings : undefined;
}

export function normalizeLanguagePairSettings(
  pair: LanguagePair,
  raw?: Partial<UserLanguagePairSettings> | null,
): UserLanguagePairSettings | undefined {
  return normalizeEntrySettings(pair, raw);
}

export function mergeLanguagePairSettings(
  pair: LanguagePair,
  current: UserLanguagePairSettings | undefined,
  patch: Partial<UserLanguagePairSettings>,
): UserLanguagePairSettings | undefined {
  return normalizeEntrySettings(pair, {
    cjkLearning: patch.cjkLearning
      ? { ...current?.cjkLearning, ...patch.cjkLearning }
      : current?.cjkLearning,
    phonetic: patch.phonetic ? { ...current?.phonetic, ...patch.phonetic } : current?.phonetic,
    learning:
      patch.learning !== undefined
        ? { ...current?.learning, ...patch.learning }
        : current?.learning,
  });
}

export function createUserLanguagePairEntry(
  pair?: Partial<LanguagePair> | null,
  id?: string,
  createdAt?: string,
  settings?: UserLanguagePairSettings,
): UserLanguagePairEntry {
  const normalizedPair = normalizeLanguagePair(pair);

  return {
    id: id ?? crypto.randomUUID(),
    pair: normalizedPair,
    createdAt: createdAt ?? new Date().toISOString(),
    settings: settings ?? defaultSettingsForPair(normalizedPair),
  };
}

export function createDefaultLanguagePairPreferences(): Pick<
  UserPreferences,
  'languagePairs' | 'activeLanguagePairId' | 'activeByMirrorGroup'
> {
  const entry = createUserLanguagePairEntry(DEFAULT_LANGUAGE_PAIR);

  return {
    languagePairs: [entry],
    activeLanguagePairId: entry.id,
    activeByMirrorGroup: {
      [buildMirrorGroupKey(entry.pair.known, entry.pair.learning)]: { ...entry.pair },
    },
  };
}

/**
 * Normalizes the per-mirror-group active pair map.
 *
 * @remarks
 * Keeps only well-formed entries whose key matches `buildMirrorGroupKey` of
 * the stored direction. When the map is empty (legacy profile), seeds it
 * from the `seedPair` direction so existing highlights survive migration.
 */
function normalizeActiveByMirrorGroup(
  raw: unknown,
  seedPair?: LanguagePair | null,
): Record<string, LanguagePair> {
  const result: Record<string, LanguagePair> = {};

  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const candidate = value as Partial<LanguagePair> | null | undefined;
      if (!isContentLanguage(candidate?.known) || !isContentLanguage(candidate?.learning)) {
        continue;
      }
      if (candidate.known === candidate.learning) {
        continue;
      }
      const pair: LanguagePair = { known: candidate.known, learning: candidate.learning };
      if (buildMirrorGroupKey(pair.known, pair.learning) !== key) {
        continue;
      }
      result[key] = pair;
    }
  }

  if (
    Object.keys(result).length === 0 &&
    isContentLanguage(seedPair?.known) &&
    isContentLanguage(seedPair?.learning) &&
    seedPair.known !== seedPair.learning
  ) {
    result[buildMirrorGroupKey(seedPair.known, seedPair.learning)] = {
      known: seedPair.known,
      learning: seedPair.learning,
    };
  }

  return result;
}

function normalizeLanguagePairEntry(
  raw: unknown,
  legacy?: {
    cjkLearning?: Partial<CjkLearningPreferences> | null;
    phonetic?: Partial<PhoneticPreferences> | null;
  },
): UserLanguagePairEntry | null {
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

  const normalizedPair = { known: pair.known, learning: pair.learning } as LanguagePair;
  const settings = normalizeEntrySettings(
    normalizedPair,
    candidate.settings as Partial<UserLanguagePairSettings> | undefined,
    legacy,
  );

  return createUserLanguagePairEntry(
    normalizedPair,
    candidate.id,
    typeof candidate.createdAt === 'string' ? candidate.createdAt : undefined,
    settings,
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
  const colorScheme = normalizeColorScheme(preferences?.colorScheme);
  const cardFocusFullscreen = normalizeCardFocusFullscreen(preferences?.cardFocusFullscreen);
  const learningProficiencyLevel = normalizeLearningProficiencyLevel(
    preferences?.learningProficiencyLevel ?? preferences?.chineseProficiencyLevel,
  );

  const legacy = {
    cjkLearning: preferences?.cjkLearning,
    phonetic: preferences?.phonetic,
  };

  const defaults = createDefaultLanguagePairPreferences();

  if (Array.isArray(preferences?.languagePairs)) {
    const normalizedEntries = dedupeLanguagePairEntries(
      preferences.languagePairs
        .map((entry) => normalizeLanguagePairEntry(entry, legacy))
        .filter((entry): entry is UserLanguagePairEntry => entry !== null),
    );

    if (normalizedEntries.length === 0) {
      return {
        theme,
        fontSize,
        colorScheme,
        cardFocusFullscreen,
        learningProficiencyLevel,
        ...defaults,
      };
    }

    const activeLanguagePairId =
      typeof preferences.activeLanguagePairId === 'string' &&
      normalizedEntries.some((entry) => entry.id === preferences.activeLanguagePairId)
        ? preferences.activeLanguagePairId
        : normalizedEntries[0].id;

    const activeEntry =
      normalizedEntries.find((entry) => entry.id === activeLanguagePairId) ?? null;
    const activeByMirrorGroup = normalizeActiveByMirrorGroup(
      preferences.activeByMirrorGroup,
      activeEntry?.pair ?? null,
    );

    return {
      theme,
      fontSize,
      colorScheme,
      cardFocusFullscreen,
      learningProficiencyLevel,
      languagePairs: normalizedEntries,
      activeLanguagePairId,
      activeByMirrorGroup,
    };
  }

  if (preferences?.languagePair) {
    const entry = createUserLanguagePairEntry(
      preferences.languagePair,
      undefined,
      undefined,
      normalizeEntrySettings(normalizeLanguagePair(preferences.languagePair), undefined, legacy),
    );

    return {
      theme,
      fontSize,
      colorScheme,
      cardFocusFullscreen,
      learningProficiencyLevel,
      languagePairs: [entry],
      activeLanguagePairId: entry.id,
      activeByMirrorGroup: normalizeActiveByMirrorGroup(undefined, entry.pair),
    };
  }

  return {
    theme,
    fontSize,
    colorScheme,
    cardFocusFullscreen,
    learningProficiencyLevel,
    ...defaults,
    activeByMirrorGroup: normalizeActiveByMirrorGroup(
      preferences?.activeByMirrorGroup,
      defaults.languagePairs[0].pair,
    ),
  };
}

export function findLanguagePairEntryId(
  entries: readonly UserLanguagePairEntry[],
  pair: LanguagePair,
): string | null {
  return entries.find((entry) => languagePairsEqual(entry.pair, pair))?.id ?? null;
}
