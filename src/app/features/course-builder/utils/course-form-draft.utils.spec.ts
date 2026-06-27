import type { CourseWithLessons } from '../../../core/models';
import {
  courseToFormDraft,
  emptyCourseFormDraft,
  formDraftToCourseWritePayload,
} from './course-form-draft.utils';

const sampleCourse: CourseWithLessons = {
  id: 'course-1',
  title: 'Test program',
  description: 'Short learner description',
  authorId: 'user-1',
  languagePair: { known: 'ru', learning: 'en' },
  lessonIds: ['lesson-1'],
  published: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  authoring: {
    idea: 'Big authoring brief for generation',
    status: 'planned',
    ideaUpdatedAt: '2026-01-02T00:00:00.000Z',
  },
  lessons: [
    {
      id: 'lesson-1',
      courseId: 'course-1',
      title: 'Lesson 1',
      description: 'Lesson desc',
      scenarioIds: ['scenario-1'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('course-form-draft.utils', () => {
  it('should include empty authoring in new draft', () => {
    const draft = emptyCourseFormDraft();

    expect(draft.authoring.idea).toBe('');
    expect(draft.authoring.status).toBe('draft');
  });

  it('should round-trip authoring from course to payload', () => {
    const draft = courseToFormDraft(sampleCourse);
    const payload = formDraftToCourseWritePayload(draft);

    expect(payload.authoring?.idea).toBe(sampleCourse.authoring?.idea);
    expect(payload.authoring?.status).toBe('planned');
  });

  it('should omit empty authoring from payload', () => {
    const payload = formDraftToCourseWritePayload(emptyCourseFormDraft());

    expect(payload.authoring).toBeUndefined();
  });
});
