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
