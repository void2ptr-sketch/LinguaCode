import type { ContentLanguage } from '../../../core/models';
import type { CardDifficulty } from '../../../core/models/card-index.types';

export type CardEditorMode = 'list' | 'create' | 'edit';

export type CardIndexMetaDraft = {
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
};

export type CardIndexMetaOverride = Partial<{
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  difficulty: CardDifficulty;
  tags: readonly string[];
  updatedAt: string;
}>;
