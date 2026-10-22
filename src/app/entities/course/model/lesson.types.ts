/**
 * A lesson within a program, containing scenarios and prerequisites.
 *
 * @remarks
 * Lessons are ordered sequentially and may have prerequisite lessons that must be completed first.
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
};
