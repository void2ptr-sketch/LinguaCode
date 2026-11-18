/**
 * A lesson within a program, containing scenarios and prerequisites.
 *
 * @remarks
 * Lessons are ordered sequentially and may have prerequisite lessons that must be completed first.
 * `languagePairId` and `courseId` are inherited from the parent program/course chain.
 */
export type Lesson = {
  id: string;
  programId: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds: readonly string[];
  order: number;
  updatedAt: string;
  published?: boolean;
  requiredTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Numeric language pair ID (from `language_pairs.id`), inherited from parent course. */
  languagePairId?: number;
  /** Course ID this lesson belongs to (inherited from parent program → course). */
  courseId?: string;
  /** ID of the lesson author. */
  authorId?: string;
};
