import type { ContentLanguage } from '../../../core/models';
import type { CardAppearance } from '../../../core/models/card.types';
import type { CardEditorUxMode } from '../utils/card-editor-ux.utils';

export type CardFormContext = {
  editorUxMode: CardEditorUxMode;
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  defaultAppearance: CardAppearance;
};
