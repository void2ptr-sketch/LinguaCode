import type { Course, CourseIndexEntry } from '../models';
import { formatLanguagePair } from './language-pair.utils';

export function courseToIndexEntry(course: Course, lessonCount: number): CourseIndexEntry {
  return {
    id: course.id,
    title: course.title,
    authorId: course.authorId,
    lessonCount,
    published: course.published,
    updatedAt: course.updatedAt,
    languagePairSummary: formatLanguagePair(course.languagePair),
  };
}
