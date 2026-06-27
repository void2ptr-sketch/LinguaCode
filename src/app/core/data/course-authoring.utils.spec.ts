import {
  courseAuthoringWithIdea,
  emptyCourseAuthoring,
  normalizeCourseAuthoring,
  sameCourseAuthoring,
} from './course-authoring.utils';

describe('course-authoring.utils', () => {
  it('should return undefined for empty draft authoring', () => {
    expect(normalizeCourseAuthoring(emptyCourseAuthoring())).toBeUndefined();
  });

  it('should keep authoring when idea is present', () => {
    const authoring = normalizeCourseAuthoring({
      idea: 'Курс для начинающих: приветствия и числа',
      status: 'draft',
    });

    expect(authoring?.idea).toContain('приветствия');
    expect(authoring?.status).toBe('draft');
  });

  it('should update ideaUpdatedAt when idea changes', () => {
    const before = emptyCourseAuthoring();
    const after = courseAuthoringWithIdea(before, 'Новая идея');

    expect(after.ideaUpdatedAt).toBeTruthy();
    expect(after.status).toBe('draft');
  });

  it('should reset materialized status to draft when idea changes', () => {
    const before = {
      idea: 'Старая идея',
      status: 'materialized' as const,
      materializedAt: '2026-01-01T00:00:00.000Z',
    };

    const after = courseAuthoringWithIdea(before, 'Новая идея');

    expect(after.status).toBe('draft');
  });

  it('should compare authoring payloads', () => {
    const left = { idea: 'A', status: 'draft' as const };
    const right = { idea: 'A', status: 'draft' as const };

    expect(sameCourseAuthoring(left, right)).toBeTrue();
    expect(sameCourseAuthoring(left, { ...right, idea: 'B' })).toBeFalse();
  });
});
