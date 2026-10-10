import type { CardKind } from '../../../core/models';
import type { CardDraft } from '../types';

const READING_ALIASES = ['reading', 'polyphony'] as const;
const TONE_ALIASES = ['tone', 'pinyin-tone'] as const;

/**
 * Generates index tags for a card draft based on its kind.
 *
 * @remarks
 * Always includes the card kind itself. For `reading` cards, adds
 * aliases `'reading'` and `'polyphony'`. For `tone` cards, adds
 * aliases `'tone'` and `'pinyin-tone'`. These tags are used for
 * catalog search and filtering.
 *
 * @param draft - The card draft to generate tags for.
 * @returns An array of index tag strings.
 */
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

/**
 * Returns a human-readable label for special card kinds in the editor UI.
 *
 * @remarks
 * Returns descriptive labels for `reading`, `tone`, and `code-select`
 * card kinds. These labels appear in editor dropdowns and selection
 * menus. Returns `null` for standard card kinds that don't need
 * special labeling.
 *
 * @param kind - The card kind to label.
 * @returns A display label string, or `null` for standard kinds.
 */
export function editorVariantLabel(kind: CardKind): string | null {
  switch (kind) {
    case 'reading':
      return 'Чтение (select + meta)';
    case 'tone':
      return 'Тон (автоварианты из слога)';
    case 'code-select':
      return 'Код: выбор ответа';
    default:
      return null;
  }
}
