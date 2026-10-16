// Barrel exports for card-editor options utils
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
  type CardOptionsEditorConfig,
  type CardOptionsEditorState,
  type CardOptionsEditorPatch,
} from './card-options-editor.utils';

export {
  resolveChoiceOptionsConfig,
  resolveChoiceOptionTexts,
  resolveChoiceOptionLexemes,
  applyChoiceOptionsState,
} from './card-choice-options.utils';
