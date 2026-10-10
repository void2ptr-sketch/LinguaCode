import type { CardKind } from '../../../../core/models';

/**
 * Data passed to the card editor dialog.
 *
 * @remarks
 * Discriminated union: `mode: 'create'` includes the card kind;
 * `mode: 'edit'` includes the card ID to edit.
 */
export type CardEditorDialogData =
  | { mode: 'create'; kind: CardKind }
  | { mode: 'edit'; cardId: string };

/**
 * Result returned from the card editor dialog.
 *
 * @remarks
 * `saved: true` indicates the card was successfully saved; `false` means the user discarded changes.
 */
export type CardEditorDialogResult = {
  saved: boolean;
};
