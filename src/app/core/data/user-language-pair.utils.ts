import type { LanguagePair } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';
import type {
  CjkLearningPreferences,
  PhoneticPreferences,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../models/user.types';
import { isAllowedFontSize, sanitizeTheme } from '../security';
import { normalizeColorScheme } from '../theme/app-color-scheme.utils';
import { normalizeCardFocusFullscreen } from './card-focus-preference.utils';
import { normalizeLearningProficiencyLevel } from './learning-proficiency.utils';
import {
  isContentLanguage,
  languagePairsEqual,
  normalizeLanguagePair,
} from './language-pair.utils';
import {
  normalizeCjkLearningPreferences,
  normalizePhoneticPreferences,
  pairSupportsPhoneticDisplay,
  shouldShowPalladius,
} from './phonetic-preferences.utils';
import { normalizeLearningSessionPreferences } from './learning-session.utils';
import {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from '../models/phonetic-content.types';

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
  if (!entry || !shouldShowPalladius(entry.pair.known, entry.pair.learning)) {
    return { ...DEFAULT_CJK_LEARNING_PREFERENCES };
  }

  return normalizeCjkLearningPreferences(entry.settings?.cjkLearning);
}

export function resolvePhoneticForPair(
  entry: UserLanguagePairEntry | null | undefined,
): PhoneticPreferences {
  if (!entry || !pairSupportsPhoneticDisplay(entry.pair.learning)) {
    return { ...DEFAULT_PHONETIC_PREFERENCES };
  }

  return normalizePhoneticPreferences(entry.settings?.phonetic);
}

export { resolveLearningSessionForPair } from './learning-session.utils';

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
  'languagePairs' | 'activeLanguagePairId'
> {
  const entry = createUserLanguagePairEntry(DEFAULT_LANGUAGE_PAIR);

  return {
    languagePairs: [entry],
    activeLanguagePairId: entry.id,
  };
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

    return {
      theme,
      fontSize,
      colorScheme,
      cardFocusFullscreen,
      learningProficiencyLevel,
      languagePairs: normalizedEntries,
      activeLanguagePairId,
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
    };
  }

  return {
    theme,
    fontSize,
    colorScheme,
    cardFocusFullscreen,
    learningProficiencyLevel,
    ...defaults,
  };
}

export function findLanguagePairEntryId(
  entries: readonly UserLanguagePairEntry[],
  pair: LanguagePair,
): string | null {
  return entries.find((entry) => languagePairsEqual(entry.pair, pair))?.id ?? null;
}
