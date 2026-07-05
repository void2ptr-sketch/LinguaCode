import { pinyinToPalladius } from './cjk-romanization.utils';
import { validateIpaInput } from '../ipa/ipa-normalize.utils';
import {
  formatIpaForEditor,
  hasLexemeContent,
  mergeLexeme,
  parseIpaVariants,
} from '../phonetic/phonetic-lexeme.utils';
import type { PhoneticLexeme, ScriptCode } from '../../models/phonetic-content.types';
import { sanitizePlainText } from '../../security';

export type LexemeDraftFields = {
  primary: string;
  script: ScriptCode;
  pinyin: string;
  zhuyin: string;
  palladius: string;
  ipa: string;
  audioUrl: string;
  acceptedReadings: string;
};

export const emptyLexemeDraftFields = (script: ScriptCode = 'latn'): LexemeDraftFields => ({
  primary: '',
  script,
  pinyin: '',
  zhuyin: '',
  palladius: '',
  ipa: '',
  audioUrl: '',
  acceptedReadings: '',
});

export function lexemeToDraftFields(lexeme?: PhoneticLexeme): LexemeDraftFields {
  if (!lexeme) {
    return emptyLexemeDraftFields();
  }

  return {
    primary: lexeme.primary,
    script: lexeme.script,
    pinyin: lexeme.pinyin ?? '',
    zhuyin: lexeme.zhuyin ?? '',
    palladius: lexeme.palladius ?? '',
    ipa: formatIpaForEditor(lexeme.ipa),
    audioUrl: lexeme.audioUrl ?? '',
    acceptedReadings: lexeme.acceptedReadings?.join(', ') ?? '',
  };
}

export function normalizePhoneticLexemeDraft(
  draft: LexemeDraftFields,
  fallbackPrimary?: string,
): PhoneticLexeme | undefined {
  const primary = sanitizePlainText(draft.primary || fallbackPrimary || '', 128);
  const pinyin = sanitizePlainText(draft.pinyin, 128) || undefined;
  const zhuyin = sanitizePlainText(draft.zhuyin, 128) || undefined;
  const palladiusInput = sanitizePlainText(draft.palladius, 128);
  const palladius = palladiusInput || (pinyin ? pinyinToPalladius(pinyin) : undefined);
  const ipaRaw = sanitizePlainText(draft.ipa, 256);
  const audioUrl = sanitizePlainText(draft.audioUrl, 512) || undefined;

  if (ipaRaw && !validateIpaInput(ipaRaw)) {
    return undefined;
  }

  const acceptedReadings = draft.acceptedReadings
    .split(',')
    .map((item) => sanitizePlainText(item, 128))
    .filter(Boolean);

  const lexeme = mergeLexeme(undefined, {
    primary: primary || fallbackPrimary || '',
    script: draft.script,
    pinyin,
    zhuyin,
    palladius,
    ipa: parseIpaVariants(ipaRaw),
    audioUrl,
    acceptedReadings: acceptedReadings.length > 0 ? acceptedReadings : undefined,
  });

  return hasLexemeContent(lexeme) ? lexeme : undefined;
}

export function collectLexemeAcceptedAnswers(lexeme?: PhoneticLexeme): readonly string[] {
  if (!lexeme) {
    return [];
  }

  const values = new Set<string>();

  for (const reading of lexeme.acceptedReadings ?? []) {
    if (reading.trim()) {
      values.add(reading.trim());
    }
  }

  if (lexeme.pinyin?.trim()) {
    values.add(lexeme.pinyin.trim());
  }

  if (lexeme.palladius?.trim()) {
    values.add(lexeme.palladius.trim());
  }

  if (lexeme.zhuyin?.trim()) {
    values.add(lexeme.zhuyin.trim());
  }

  if (typeof lexeme.ipa === 'string' && lexeme.ipa.trim()) {
    values.add(lexeme.ipa.trim());
  } else if (Array.isArray(lexeme.ipa)) {
    for (const variant of lexeme.ipa) {
      if (variant.transcription.trim()) {
        values.add(variant.transcription.trim());
      }
    }
  }

  return [...values];
}
