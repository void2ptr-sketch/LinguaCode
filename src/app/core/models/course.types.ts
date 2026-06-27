import type { LanguagePair } from './language-pair.types';
import type { CourseAuthoring } from './course-authoring.types';
import type { CoursePracticeSettings } from './course-practice.types';

export type { CourseAuthoring, CourseAuthoringStatus } from './course-authoring.types';
export { COURSE_AUTHORING_STATUSES } from './course-authoring.types';
export type { CoursePracticeMode, CoursePracticeSettings } from './course-practice.types';
export { DEFAULT_COURSE_PRACTICE_SETTINGS } from './course-practice.types';

export type Course = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  languagePair: LanguagePair;
  lessonIds: readonly string[];
  published: boolean;
  updatedAt: string;
  /** Авторская идея программы; не попадает в CourseIndexEntry. */
  authoring?: CourseAuthoring;
  /** Настройки вкладки «Практика»; по умолчанию guided (линейный курс). */
  practiceSettings?: CoursePracticeSettings;
};

export type CourseWithLessons = Course & {
  lessons: readonly import('./lesson.types').Lesson[];
};
