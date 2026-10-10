/**
 * A lesson within a course, containing scenarios and prerequisites.
 *
 * @remarks
 * Lessons are ordered sequentially and may have prerequisite lessons that must be completed first.
 */
export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds: readonly string[];
  order: number;
  updatedAt: string;
};
