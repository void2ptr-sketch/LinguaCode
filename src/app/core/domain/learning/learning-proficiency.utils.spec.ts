import {
  isLearningProficiencyLevel,
  normalizeLearningProficiencyLevel,
} from './learning-proficiency.utils';

describe('learning-proficiency.utils', () => {
  it('should recognize valid proficiency levels', () => {
    expect(isLearningProficiencyLevel('intermediate')).toBe(true);
    expect(isLearningProficiencyLevel('professional')).toBe(true);
    expect(isLearningProficiencyLevel('invalid')).toBe(false);
  });

  it('should normalize unknown values to default', () => {
    expect(normalizeLearningProficiencyLevel('advanced')).toBe('advanced');
    expect(normalizeLearningProficiencyLevel(undefined)).toBe('beginner');
    expect(normalizeLearningProficiencyLevel(null)).toBe('beginner');
  });

  it('should migrate legacy new-to-chinese id', () => {
    expect(normalizeLearningProficiencyLevel('new-to-chinese')).toBe('new-to-language');
    expect(isLearningProficiencyLevel('new-to-chinese')).toBe(true);
  });
});
