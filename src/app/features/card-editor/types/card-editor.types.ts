import type { ContentLanguage } from '../../../core/models';
import type { CardDifficulty } from '../../../core/models';
/**
 * Mode of the card editor UI.
 *
 * - `list` — shows the card catalog.
 * - `create` — shows the card creation form.
 * - `edit` — shows the card editing form.
 */
export type CardEditorMode = 'list' | 'create' | 'edit';

/**
 * Draft of card index metadata for a newly created card.
 *
 * @remarks
 * Used when creating a card to set the initial index metadata values.
 * Contains the language pair (known and learning languages).
 */
export type CardIndexMetaDraft = {
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
};

/**
 * Partial override for card index metadata.
 *
 * @remarks
 * Used to update specific index fields without replacing the entire metadata object.
 * Can include difficulty, tags, updatedAt timestamp, and language pair overrides.
 */
export type CardIndexMetaOverride = Partial<{
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  difficulty: CardDifficulty;
  tags: readonly string[];
  updatedAt: string;
}>;
