import type {
  IpaVariant,
  PhoneticLexeme,
  RomanizationSystem,
  ScriptCode,
} from '../../models/phonetic-content.types';
import { ROMANIZATION_DISPLAY_ORDER } from '../../models/phonetic-content.types';

export type VisibleRomanizationReading = {
  system: RomanizationSystem;
  reading: string;
};

export function emptyPhoneticLexeme(script: ScriptCode = 'latn'): PhoneticLexeme {
  return { primary: '', script };
}

export function lexemeFromPrimary(primary: string, script: ScriptCode = 'latn'): PhoneticLexeme {
  const trimmed = primary.trim();
  return trimmed ? { primary: trimmed, script } : emptyPhoneticLexeme(script);
}

export function lexemeFromHan(han: string): PhoneticLexeme {
  return lexemeFromPrimary(han, 'hani');
}

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

export function hasLexemeContent(lexeme: PhoneticLexeme | null | undefined): boolean {
  if (!lexeme) {
    return false;
  }

  return Boolean(lexeme.primary.trim() || hasLexemePhoneticLayers(lexeme));
}

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

export function resolveLexemeRubyAnnotation(
  lexeme: PhoneticLexeme,
  romanization: RomanizationSystem,
): string | null {
  if (lexeme.script === 'hani') {
    return resolveRomanizationReading(lexeme, romanization);
  }

  return null;
}

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
