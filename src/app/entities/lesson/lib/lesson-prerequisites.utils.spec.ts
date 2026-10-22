import type { Lesson } from '../../course/model';
import {
  buildLessonsById,
  isLessonCompleted,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from './lesson-prerequisites.utils';

const baseLesson: Lesson = {
  id: 'l1',
  programId: 'p1',
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

  it('should treat lesson as not completed when some scenarios are missing results', () => {
    const lessonWithTwoScenarios = { ...baseLesson, scenarioIds: ['s1', 's2'] };
    const completed = isLessonCompleted(
      lessonWithTwoScenarios,
      (scenarioId) => scenarioId === 's1',
    );
    expect(completed).toBe(false);
  });

  it('should treat lesson with no scenarios as not completed', () => {
    const emptyLesson = { ...baseLesson, scenarioIds: [] };
    const completed = isLessonCompleted(emptyLesson, () => true);
    expect(completed).toBe(false);
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

  it('should unlock lesson when there are no prerequisites', () => {
    const unlocked = isLessonUnlocked(baseLesson, new Map(), () => false);
    expect(unlocked).toBe(true);
  });

  it('should unlock lesson when prerequisites is null', () => {
    const lessonWithoutPrereqs = {
      ...baseLesson,
      prerequisiteLessonIds: undefined as unknown as string[],
    };
    const unlocked = isLessonUnlocked(lessonWithoutPrereqs, new Map(), () => false);
    expect(unlocked).toBe(true);
  });

  it('should lock lesson when prerequisite is missing from map', () => {
    const lessons = [
      {
        ...baseLesson,
        id: 'l2',
        title: 'Урок 2',
        prerequisiteLessonIds: ['non-existent'],
        order: 1,
      },
    ];
    const lessonsById = buildLessonsById([]);
    const locked = isLessonUnlocked(lessons[0], lessonsById, () => false);
    expect(locked).toBe(false);
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

  it('should return block reason with lesson id when title is missing', () => {
    const lessons = [
      {
        ...baseLesson,
        id: 'l2',
        prerequisiteLessonIds: ['l1'],
      },
    ];
    // lessons array doesn't include l1, so title lookup fails
    const reason = prerequisiteBlockReason(lessons[0], lessons, () => false);

    expect(reason).toBe('Сначала завершите урок «l1»');
  });

  it('should return null when no prerequisites block', () => {
    const lessons = [
      baseLesson,
      {
        ...baseLesson,
        id: 'l2',
        prerequisiteLessonIds: ['l1'],
      },
    ];
    const reason = prerequisiteBlockReason(lessons[1], lessons, () => true);

    expect(reason).toBeNull();
  });

  it('should return null when lesson has no prerequisites', () => {
    const reason = prerequisiteBlockReason(baseLesson, [], () => false);
    expect(reason).toBeNull();
  });

  it('should build empty map from empty array', () => {
    const map = buildLessonsById([]);
    expect(map.size).toBe(0);
  });

  it('should build map with correct keys', () => {
    const lessons = [
      { id: 'a', scenarioIds: [] },
      { id: 'b', scenarioIds: ['s1'] },
    ];
    const map = buildLessonsById(lessons);
    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(true);
    expect(map.get('a')?.id).toBe('a');
    expect(map.get('b')?.scenarioIds).toEqual(['s1']);
  });
});
