import type { ContentLanguage } from '../../../core/models';

export type CardEditorMode = 'list' | 'create' | 'edit';

export type CardIndexMetaDraft = {
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
};
