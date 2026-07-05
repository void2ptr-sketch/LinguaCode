import type { Lesson } from '../../models';
import {
  buildLessonsById,
  isLessonCompleted,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from './lesson-prerequisites.utils';

const baseLesson: Lesson = {
  id: 'l1',
  courseId: 'c1',
  title: 'Урок 1',
  description: '',
  scenarioIds: ['s1'],
  prerequisiteLessonIds: [],
  order: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('lesson-prerequisites.utils', () => {
  it('should treat lesson as completed when every scenario has a result', () => {
    const completed = isLessonCompleted(baseLesson, (scenarioId) => scenarioId === 's1');
    expect(completed).toBe(true);
  });

  it('should lock lesson until prerequisites are completed', () => {
    const lessons = [
      baseLesson,
      {
        ...baseLesson,
        id: 'l2',
        title: 'Урок 2',
        prerequisiteLessonIds: ['l1'],
        order: 1,
      },
    ];
    const lessonsById = buildLessonsById(lessons);
    const hasResult = (scenarioId: string) => scenarioId === 's1';

    expect(isLessonUnlocked(lessons[1], lessonsById, () => false)).toBe(false);
    expect(isLessonUnlocked(lessons[1], lessonsById, hasResult)).toBe(true);
  });

  it('should return block reason for incomplete prerequisite', () => {
    const lessons = [
      baseLesson,
      {
        ...baseLesson,
        id: 'l2',
        prerequisiteLessonIds: ['l1'],
      },
    ];
    const reason = prerequisiteBlockReason(lessons[1], lessons, () => false);

    expect(reason).toBe('Сначала завершите урок «Урок 1»');
  });
});
