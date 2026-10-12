import type { ContentLanguage } from '../../../entities/card/model';
import type { CardAppearance } from '../../../entities/card/model';
import type { CardEditorUxMode } from '../utils/ux/card-editor-ux.utils';

/**
 * Context passed to card form components.
 *
 * @remarks
 * Provides the UX mode, language pair, and default appearance settings
 * that the form uses to render card-specific fields.
 */
export type CardFormContext = {
  /** The editor UX mode ('basic' or 'advanced'). */
  editorUxMode: CardEditorUxMode;
  /** Known (source) language. */
  knownLanguage: ContentLanguage;
  /** Learning (target) language. */
  learningLanguage: ContentLanguage;
  /** Default appearance settings for the preview. */
  defaultAppearance: CardAppearance;
};
