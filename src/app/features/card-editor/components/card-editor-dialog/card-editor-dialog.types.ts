import type { CardKind } from '../../../../core/models';

export type CardEditorDialogData =
  | { mode: 'create'; kind: CardKind }
  | { mode: 'edit'; cardId: string };

export type CardEditorDialogResult = {
  saved: boolean;
};
