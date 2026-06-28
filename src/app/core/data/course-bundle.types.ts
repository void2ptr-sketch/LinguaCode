import type { Card } from '../models';
import type { Course, Lesson } from '../models';
import type { Scenario } from '../models';
import type { CardIndexMetaOverride } from './card-index.mapper';

/**
 * Единый самодостаточный JSON-пакет для переноса курса из localStorage
 * в seed-файлы репозитория.
 *
 * @see docs/COURSE-BUNDLE.md
 */
export type CourseBundle = {
  /** Всегда 1 для текущего формата. */
  formatVersion: 1;
  /** ISO-дата экспорта. */
  exportedAt: string;
  /** ID автора из localStorage (local-user). */
  sourceAuthorId?: string;
  /** Ровно одна программа с её уроками. */
  course: {
    courses: Course[];
    lessons: Lesson[];
  };
  /** Все сценарии, на которые ссылаются уроки. */
  scenarios: Scenario[];
  /** Все карточки, на которые ссылаются сценарии. */
  cards: Card[];
  /** Мета-информация для каждой карточки в пакете. */
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};

/**
 * Результат валидации пакета перед экспортом.
 */
export type CourseBundleValidation = {
  valid: boolean;
  errors: readonly string[];
};

/**
 * Ошибка, блокирующая экспорт курса.
 */
export type CourseBundleError = {
  code: 'criteria-scenario' | 'missing-lesson' | 'missing-scenario' | 'missing-card' | 'missing-meta';
  message: string;
  entityId: string;
};
