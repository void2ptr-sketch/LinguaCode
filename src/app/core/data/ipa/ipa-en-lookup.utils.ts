import type { IpaVariant } from '../../models/phonetic-content.types';
import { formatIpaForEditor } from '../phonetic/phonetic-lexeme.utils';

type EnglishIpaEntry = string | readonly IpaVariant[];

/** Curated subset (CMUdict / Wiktionary style) for editor autofill — not a full dictionary. */
const ENGLISH_IPA_LOOKUP: Readonly<Record<string, EnglishIpaEntry>> = {
  cat: 'kæt',
  dog: 'dɒɡ',
  goodbye: 'ɡʊdˈbaɪ',
  hello: 'həˈləʊ',
  thanks: 'θæŋks',
  taught: 'tɔːt',
  thought: [
    { label: 'BrE', transcription: 'θɔːt' },
    { label: 'AmE', transcription: 'θɔt' },
  ],
  through: 'θruː',
  world: 'wɜːld',
};

export function lookupEnglishIpa(word: string): string | null {
  const key = word.trim().toLowerCase();
  if (!key) {
    return null;
  }

  const entry = ENGLISH_IPA_LOOKUP[key];
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return entry;
  }

  return formatIpaForEditor(entry);
}
