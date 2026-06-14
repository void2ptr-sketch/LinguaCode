import type { CardKind } from '../../../core/models';
import type { CardDraft } from '../types';

const READING_ALIASES = ['reading', 'polyphony'] as const;
const TONE_ALIASES = ['tone', 'pinyin-tone'] as const;

export function indexTagsForDraft(draft: CardDraft): readonly string[] {
  const tags = new Set<string>([draft.kind]);

  if (draft.kind === 'reading') {
    for (const tag of READING_ALIASES) {
      tags.add(tag);
    }
  }

  if (draft.kind === 'tone') {
    for (const tag of TONE_ALIASES) {
      tags.add(tag);
    }
  }

  return [...tags];
}

export function editorVariantLabel(kind: CardKind): string | null {
  switch (kind) {
    case 'reading':
      return 'Чтение (select + meta)';
    case 'tone':
      return 'Тон (автоварианты из слога)';
    default:
      return null;
  }
}
