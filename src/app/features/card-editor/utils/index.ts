// Barrel exports for card-editor utils

// ===== Utils =====
export { emptyCardDraft } from './card-draft.utils';
export { cardFormKindGroup, CARD_FORM_KIND_GROUP } from './card-form.registry';
export { normalizeCardDraft, cardValidationErrorMessage } from './card-validation.utils';

// ===== Card creation groups =====
export {
  CARD_CREATE_GROUPS,
  CARD_CREATE_GROUP_LABELS,
  CARD_CREATE_GROUP_HINTS,
  KINDS_BY_CREATE_GROUP,
  DEFAULT_KIND_BY_CREATE_GROUP,
  createGroupForKind,
  type CardCreateGroup,
} from './card-create-groups.utils';

// ===== Lexeme-first draft transformation =====
export { deriveOptionText, deriveOptionTexts, applyLexemeFirstToDraft } from './card-draft-lexeme-first.utils';

// ===== Editor UX mode =====
export {
  EDITOR_UX_MODE_STORAGE_KEY,
  loadEditorUxMode,
  saveEditorUxMode,
  defaultScriptForLanguages,
  syncLexemePrimaryFromText,
  isRuZhPair,
  isEnLearningPair,
  type CardEditorUxMode,
} from './card-editor-ux.utils';

// ===== Index meta tags =====
export { indexTagsForDraft, editorVariantLabel } from './card-kind-index-meta.utils';

// ===== Options editor =====
export {
  MIN_CARD_OPTIONS,
  MAX_CARD_OPTIONS,
  createEmptyOptionsState,
  optionTextReadonly,
  syncOptionLexemes,
  updateOptionText,
  updateOptionLexeme,
  addOption,
  removeOption,
  type CardOptionsEditorState,
  type CardOptionsEditorPatch,
} from './card-options-editor.utils';

// ===== Tone variants =====
export { toneVariantLabels, toneVariantPreview } from './tone-variant.utils';
