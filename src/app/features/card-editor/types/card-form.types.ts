import type { ContentLanguage } from '../../../core/models';
import type { CardAppearance } from '../../../core/models/card.types';
import type { CardEditorUxMode } from '../utils/card-editor-ux.utils';

/**
 * Context passed to card form components.
 *
 * @remarks
 * Provides the UX mode, language pair, and default appearance settings
 * that the form uses to render card-specific fields.
 */
export type CardFormContext = {
  editorUxMode: CardEditorUxMode;
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  defaultAppearance: CardAppearance;
};
