import type { LanguagePair } from './language-pair.types';

export type Course = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  languagePair: LanguagePair;
  lessonIds: readonly string[];
  published: boolean;
  updatedAt: string;
};

export type CourseWithLessons = Course & {
  lessons: readonly import('./lesson.types').Lesson[];
};
