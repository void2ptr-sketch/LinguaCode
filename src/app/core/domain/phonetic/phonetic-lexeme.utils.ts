import type {
  IpaVariant,
  PhoneticLexeme,
  RomanizationSystem,
  ScriptCode,
} from '../../models/phonetic-content.types';
import { ROMANIZATION_DISPLAY_ORDER } from '../../models/phonetic-content.types';

/**
 * A romanization reading that is eligible for display in the UI.
 */
export type VisibleRomanizationReading = {
  system: RomanizationSystem;
  reading: string;
};

/**
 * Creates an empty `PhoneticLexeme` with the given script.
 *
 * @param script — Script code for the lexeme (defaults to `'latn'`).
 * @returns An empty phonetic lexeme object.
 */
export function emptyPhoneticLexeme(script: ScriptCode = 'latn'): PhoneticLexeme {
  return { primary: '', script };
}

/**
 * Creates a `PhoneticLexeme` from a primary text value.
 *
 * Trims whitespace from the input; returns an empty lexeme if the result is blank.
 *
 * @param primary — Primary text for the lexeme.
 * @param script — Script code (defaults to `'latn'`).
 * @returns A phonetic lexeme with the trimmed primary text.
 */
export function lexemeFromPrimary(primary: string, script: ScriptCode = 'latn'): PhoneticLexeme {
  const trimmed = primary.trim();
  return trimmed ? { primary: trimmed, script } : emptyPhoneticLexeme(script);
}

/**
 * Creates a `PhoneticLexeme` from a Han character string, setting the script to `'hani'`.
 *
 * @param han — Han character(s) for the lexeme.
 * @returns A phonetic lexeme with script set to `'hani'`.
 */
export function lexemeFromHan(han: string): PhoneticLexeme {
  return lexemeFromPrimary(han, 'hani');
}

/**
 * Checks whether a phonetic lexeme contains any phonetic layer data (pinyin, zhuyin, Palladius, or IPA).
 *
 * @param lexeme — Lexeme to inspect, possibly `null` or `undefined`.
 * @returns `true` if at least one phonetic layer has non-empty content.
 */
export function hasLexemePhoneticLayers(lexeme: PhoneticLexeme | null | undefined): boolean {
  if (!lexeme) {
    return false;
  }

  return Boolean(
    lexeme.pinyin?.trim() ||
    lexeme.zhuyin?.trim() ||
    lexeme.palladius?.trim() ||
    resolveIpaString(lexeme.ipa),
  );
}

/**
 * Checks whether a phonetic lexeme has any content — primary text or phonetic layers.
 *
 * @param lexeme — Lexeme to inspect, possibly `null` or `undefined`.
 * @returns `true` if the lexeme has non-empty primary text or phonetic layers.
 */
export function hasLexemeContent(lexeme: PhoneticLexeme | null | undefined): boolean {
  if (!lexeme) {
    return false;
  }

  return Boolean(lexeme.primary.trim() || hasLexemePhoneticLayers(lexeme));
}

/**
 * Resolves a single IPA string from a lexeme's IPA data.
 *
 * When `preferredLabel` is provided, returns the transcription for the matching variant.
 * Otherwise, returns the first available transcription. Returns `null` for empty or missing data.
 *
 * @param ipa — IPA data, either a plain string or an array of variants.
 * @param preferredLabel — Optional label to select a specific IPA variant.
 * @returns The resolved IPA transcription, or `null` if none is available.
 */
export function resolveIpaString(
  ipa: PhoneticLexeme['ipa'],
  preferredLabel?: string,
): string | null {
  if (!ipa) {
    return null;
  }

  if (typeof ipa === 'string') {
    return ipa.trim() || null;
  }

  if (ipa.length === 0) {
    return null;
  }

  if (preferredLabel) {
    const match = ipa.find((item) => item.label === preferredLabel);
    if (match?.transcription.trim()) {
      return match.transcription.trim();
    }
  }

  return ipa[0]?.transcription.trim() || null;
}

/**
 * Resolves a romanization reading for the given system from a phonetic lexeme.
 *
 * Supports `pinyin`, `zhuyin`, and `palladius` systems. Returns `null` when the reading is missing.
 *
 * @param lexeme — Lexeme to read from.
 * @param system — Romanization system to resolve.
 * @returns The trimmed reading string, or `null` if unavailable.
 */
export function resolveRomanizationReading(
  lexeme: PhoneticLexeme,
  system: RomanizationSystem,
): string | null {
  switch (system) {
    case 'pinyin':
      return lexeme.pinyin?.trim() || null;
    case 'zhuyin':
      return lexeme.zhuyin?.trim() || null;
    case 'palladius':
      return lexeme.palladius?.trim() || null;
  }
}

/**
 * Resolves a ruby annotation for a phonetic lexeme, used for hanzi pronunciation display.
 *
 * Returns a romanization reading only when the lexeme script is `'hani'`; otherwise returns `null`.
 *
 * @param lexeme — Lexeme to read from.
 * @param romanization — Romanization system to use.
 * @returns The ruby annotation string, or `null`.
 */
export function resolveLexemeRubyAnnotation(
  lexeme: PhoneticLexeme,
  romanization: RomanizationSystem,
): string | null {
  if (lexeme.script === 'hani') {
    return resolveRomanizationReading(lexeme, romanization);
  }

  return null;
}

/**
 * Resolves all visible romanization readings for a lexeme based on enabled systems.
 *
 * Returns an empty array when the lexeme script is not `'hani'` and no romanization fields are present.
 * Readings are returned in the order defined by `ROMANIZATION_DISPLAY_ORDER`.
 *
 * @param lexeme — Lexeme to read from.
 * @param enabledSystems — Array of romanization systems enabled for display.
 * @returns List of visible romanization readings.
 */
export function resolveVisibleRomanizationReadings(
  lexeme: PhoneticLexeme,
  enabledSystems: readonly RomanizationSystem[],
): readonly VisibleRomanizationReading[] {
  const hasRomanizationField = Boolean(
    lexeme.pinyin?.trim() || lexeme.zhuyin?.trim() || lexeme.palladius?.trim(),
  );

  if (lexeme.script !== 'hani' && !hasRomanizationField) {
    return [];
  }

  return ROMANIZATION_DISPLAY_ORDER.flatMap((system) => {
    if (!enabledSystems.includes(system)) {
      return [];
    }

    const reading = resolveRomanizationReading(lexeme, system);
    return reading ? [{ system, reading }] : [];
  });
}

/**
 * Merges a patch into a base phonetic lexeme, creating a new object.
 *
 * Copies array fields (`ipa`, `acceptedReadings`, `tones`) to new arrays to avoid mutating the patch.
 * Falls back to an empty lexeme with the patch's script when the base is `undefined`.
 *
 * @param base — Base lexeme to merge into.
 * @param patch — Partial lexeme with fields to override.
 * @returns A new `PhoneticLexeme` with merged data.
 */
export function mergeLexeme(
  base: PhoneticLexeme | undefined,
  patch: Partial<PhoneticLexeme>,
): PhoneticLexeme {
  const next: PhoneticLexeme = {
    ...(base ?? emptyPhoneticLexeme(patch.script ?? 'latn')),
    ...patch,
  };

  if (typeof patch.ipa === 'string') {
    next.ipa = patch.ipa;
  } else if (patch.ipa) {
    next.ipa = [...patch.ipa];
  }

  if (patch.acceptedReadings) {
    next.acceptedReadings = [...patch.acceptedReadings];
  }

  if (patch.tones) {
    next.tones = [...patch.tones];
  }

  return next;
}

/**
 * Parses a pipe-separated IPA string into either a plain string or an array of IPA variants.
 *
 * When the input contains no pipe (`|`) characters, returns the trimmed string directly.
 * Otherwise, splits on `|` and parses each segment into `{ label, transcription }` objects
 * when a colon separator is present.
 *
 * @param value — Raw IPA string to parse.
 * @returns A plain string, an array of `IpaVariant` objects, or `undefined` for empty input.
 */
export function parseIpaVariants(value: string): string | readonly IpaVariant[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!trimmed.includes('|')) {
    return trimmed;
  }

  return trimmed.split('|').map((part) => {
    const segment = part.trim();
    const colonIndex = segment.indexOf(':');
    if (colonIndex === -1) {
      return { transcription: segment };
    }

    return {
      label: segment.slice(0, colonIndex).trim(),
      transcription: segment.slice(colonIndex + 1).trim(),
    };
  });
}

/**
 * Formats IPA data for display in an editor input field.
 *
 * Plain strings are returned as-is. Arrays are joined with ` | ` separators,
 * with each variant formatted as `label:transcription` when a label is present.
 *
 * @param ipa — IPA data to format.
 * @returns Formatted string suitable for editor display.
 */
export function formatIpaForEditor(ipa: PhoneticLexeme['ipa']): string {
  if (!ipa) {
    return '';
  }

  if (typeof ipa === 'string') {
    return ipa;
  }

  return ipa
    .map((item) => (item.label ? `${item.label}:${item.transcription}` : item.transcription))
    .join(' | ');
}
