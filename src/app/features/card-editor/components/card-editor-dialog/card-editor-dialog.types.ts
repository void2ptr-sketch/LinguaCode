import type { CardKind } from '../../../../entities/card/model';

/**
 * Context pre-filled when creating a card from the Content Explorer.
 *
 * @remarks
 * The dialog uses it to bind the new card to the selected scenario and to
 * pre-fill the course/program/lesson hierarchy.
 */
export type CardEditorCreateContext = {
  scenarioId?: string;
  courseId?: string;
  programId?: string;
  lessonId?: string;
  languagePairId?: string;
};

/**
 * Data passed to the card editor dialog.
 *
 * @remarks
 * Discriminated union: `mode: 'create'` includes the card kind and optional
 * hierarchy context; `mode: 'edit'` includes the card ID to edit.
 */
export type CardEditorDialogData =
  | { mode: 'create'; kind: CardKind; context?: CardEditorCreateContext }
  | { mode: 'edit'; cardId: string };

/**
 * Result returned from the card editor dialog.
 *
 * @remarks
 * `saved: true` indicates the card was successfully saved; `false` means the user discarded changes.
 * `cardId` and `scenarioId` are returned so the caller can refresh the tree and bind the card.
 */
export type CardEditorDialogResult = {
  saved: boolean;
  cardId?: string;
  scenarioId?: string;
};
