/**
 * A program: a learning track within a Course, containing ordered lessons.
 *
 * @remarks
 * Programs are the intermediate level between Course and Lesson:
 * Course → Program → Lesson → Scenario → Card.
 *
 * Programs are authored by a user and belong to a single Course.
 * They do not have their own `LanguagePair` — the scope is inherited from the parent Course.
 */
export type Program = {
  /** Unique program identifier. */
  id: string;
  /** ID of the parent Course this program belongs to. */
  courseId: string;
  /** Display title of the program. */
  title: string;
  /** Program description shown in the catalog. */
  description: string;
  /** IDs of lessons contained in this program, in order. */
  lessonIds: readonly string[];
  /** Display order within the parent Course. */
  order: number;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
};

/**
 * A program with its lessons fully resolved.
 *
 * @remarks
 * Used in the course builder and journey map where lesson details are needed.
 */
export type ProgramWithLessons = Program & {
  /** Resolved lesson objects with full metadata. */
  lessons: readonly import('../../course/model').Lesson[];
};
