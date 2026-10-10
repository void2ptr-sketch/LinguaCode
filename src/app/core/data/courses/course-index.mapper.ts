import type { Course, CourseIndexEntry } from '../../models';
import { formatLanguagePair } from '../language-pair/language-pair.utils';

/**
 * Maps a `Course` object to a `CourseIndexEntry` for catalog display and search.
 *
 * Includes the formatted language pair summary derived from the course's `languagePair`.
 */
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
