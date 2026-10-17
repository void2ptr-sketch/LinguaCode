import { describe, expect, it } from 'vitest';

import { buildContinueLinkQueryParams, continueButtonLabel } from './learning-dashboard.types';
import type { LearningResumeTarget } from '../../../entities/learning/lib/learning-resume.utils';

describe('learning-dashboard.types', () => {
  describe('buildContinueLinkQueryParams', () => {
    it('should return null when target is null', () => {
      expect(buildContinueLinkQueryParams(null)).toBeNull();
    });

    it('should return null when target has no scenarioId', () => {
      const target = {
        kind: 'continue' as const,
        courseId: 'c1',
        lessonId: 'l1',
      } as LearningResumeTarget;
      expect(buildContinueLinkQueryParams(target)).toBeNull();
    });

    it('should return null for no-program kind', () => {
      const target = {
        kind: 'no-program' as const,
        courseId: 'c1',
        lessonId: 'l1',
        scenarioId: 's1',
      } as LearningResumeTarget;
      expect(buildContinueLinkQueryParams(target)).toBeNull();
    });

    it('should return query params for continue target', () => {
      const target = {
        kind: 'continue' as const,
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
        lessonTitle: 'Урок 1',
        scenarioTitle: 'Сценарий 1',
      } as LearningResumeTarget;

      const params = buildContinueLinkQueryParams(target);
      expect(params).toEqual({
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
        tab: 'learning',
      });
    });

    it('should return query params for start target', () => {
      const target = {
        kind: 'start' as const,
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
        lessonTitle: 'Урок 1',
        scenarioTitle: 'Сценарий 1',
      } as LearningResumeTarget;

      const params = buildContinueLinkQueryParams(target);
      expect(params).toEqual({
        courseId: 'course-1',
        lessonId: 'lesson-1',
        scenarioId: 'scenario-1',
        tab: 'learning',
      });
    });
  });

  describe('continueButtonLabel', () => {
    it('should return default label for null target', () => {
      expect(continueButtonLabel(null)).toBe('Выбрать программу');
    });

    it('should return default label for no-program kind', () => {
      const target = { kind: 'no-program' as const } as LearningResumeTarget;
      expect(continueButtonLabel(target)).toBe('Выбрать программу');
    });

    it('should return repeat label for course-complete kind', () => {
      const target = {
        kind: 'course-complete' as const,
        courseTitle: 'Курс по пиньиню',
      } as LearningResumeTarget;
      expect(continueButtonLabel(target)).toBe('Повторить: Курс по пиньиню');
    });

    it('should return start label for start kind', () => {
      const target = {
        kind: 'start' as const,
        lessonTitle: 'Введение',
      } as LearningResumeTarget;
      expect(continueButtonLabel(target)).toBe('Начать: Введение');
    });

    it('should return continue label for continue kind', () => {
      const target = {
        kind: 'continue' as const,
        lessonTitle: 'Урок 5',
        scenarioTitle: 'Диалог',
      } as LearningResumeTarget;
      expect(continueButtonLabel(target)).toBe('Продолжить: Урок 5 · Диалог');
    });
  });
});
