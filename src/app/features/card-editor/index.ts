// ===== Components =====
export { CardAppearanceFieldsComponent } from './components/card-appearance-fields/card-appearance-fields.component';
export { CardCreateWizardComponent } from './components/card-create-wizard/card-create-wizard.component';
export { CardEditorDialogComponent } from './components/card-editor-dialog/card-editor-dialog.component';
export { CardFormComponent } from './components/card-form/card-form.component';
export { CardFormAnswersTabComponent } from './components/card-form-answers-tab/card-form-answers-tab.component';
export { CardFormAppearanceTabComponent } from './components/card-form-appearance-tab/card-form-appearance-tab.component';
export { CardFormContentTabComponent } from './components/card-form-content-tab/card-form-content-tab.component';
export { CardFormPhoneticsPanelComponent } from './components/card-form-phonetics-panel/card-form-phonetics-panel.component';
export { CardFormPlacementTabComponent } from './components/card-form-placement-tab/card-form-placement-tab.component';
export { CardFormPublishingTabComponent } from './components/card-form-publishing-tab/card-form-publishing-tab.component';
export {
  CardFormTabsComponent,
  type TabDefinition,
  type TabId,
} from './components/card-form-tabs/card-form-tabs.component';
export { CardMetaFieldsComponent } from './components/card-meta-fields/card-meta-fields.component';
export { CardOptionsEditorComponent } from './components/card-options-editor/card-options-editor.component';
export { CardPreviewComponent } from './components/card-preview/card-preview.component';
export { CardTryDialogComponent } from './components/card-try-dialog/card-try-dialog.component';
export { LexemeFieldsComponent } from './components/lexeme-fields/lexeme-fields.component';

// ===== Services =====
export { CardEditorDialogService } from './components/card-editor-dialog/card-editor-dialog.service';
export { CardEditorStore } from './services/card-editor.store';
export { CardTryDialogService } from './components/card-try-dialog/card-try-dialog.service';

// ===== Utils / Types =====
export type { CardEditorMode } from './types/card-editor.types';
export type { CardDraft } from './types/card-draft.types';
export type { CardFormContext } from './types/card-form.types';
export { emptyCardDraft } from './utils/draft/card-draft.utils';
export { cardFormKindGroup, CARD_FORM_KIND_GROUP } from './utils/form/card-form.registry';
export {
  normalizeCardDraft,
  cardValidationErrorMessage,
  cardDraftTabIssues,
  type CardDraftTabIssues,
} from './utils/validation/card-validation.utils';
