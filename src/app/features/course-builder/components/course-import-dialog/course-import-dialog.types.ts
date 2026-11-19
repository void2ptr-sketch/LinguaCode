/**
 * Types for the course import confirmation dialog.
 */

/** Preview data shown in the import confirmation dialog. */
export type ImportPreview = {
  /** Title of the course in the bundle. */
  courseTitle: string;
  /** Number of programs in the bundle. */
  programCount: number;
  /** Number of lessons in the bundle. */
  lessonCount: number;
  /** Number of scenarios in the bundle. */
  scenarioCount: number;
  /** Number of cards in the bundle. */
  cardCount: number;
  /** Bundle file size in bytes (for warning about localStorage limits). */
  fileSize?: number;
};

/** Result returned when the user confirms the import. */
export type ImportConfirmResult = {
  /** Whether the user confirmed the import. */
  confirmed: true;
  /** The JSON text of the bundle to import. */
  bundleJson: string;
};
