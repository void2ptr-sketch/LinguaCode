import type { Card } from '../../card/model';
import type { Course, Lesson } from '../model';
import type { Program } from '../../program/model';
import type { Scenario } from '../../scenario/model';
import type { CardIndexMetaOverride } from '../../card/model';

// ──────────────────────────────────────────────
// CourseBundle v2 — вложенная древовидная структура
// ──────────────────────────────────────────────

/**
 * Корневой тип пакета курса (формат v2).
 *
 * @remarks
 * Вложенная древовидная структура: Course → Programs → Lessons → Scenarios → Cards.
 * Каждый уровень сохраняет ВСЕ свои поля + поле `order` для явного порядка.
 *
 * @example
 * ```json
 * {
 *   "formatVersion": 2,
 *   "exportedAt": "2026-11-18T00:00:00.000Z",
 *   "sourceAuthorId": "user-123",
 *   "course": {
 *     "id": "course-1",
 *     "title": "Иероглифы",
 *     "description": "Изучение иероглифов",
 *     "authorId": "user-123",
 *     "slug": "course-hanzi",
 *     "languagePair": { "source": "ru", "target": "zh" },
 *     "programIds": ["prog-1"],
 *     "order": 0,
 *     "published": true,
 *     "updatedAt": "2026-11-18T00:00:00.000Z",
 *     "authoring": {
 *       "idea": "Курс базовых иероглифов для начинающих с нуля",
 *       "status": "materialized",
 *       "ideaUpdatedAt": "2026-11-18T00:00:00.000Z",
 *       "materializedAt": "2026-11-18T00:00:00.000Z",
 *       "lastError": null
 *     },
 *     "practiceSettings": { "mode": "guided" }
 *   },
 *   "programs": [
 *     {
 *       "program": { "id": "prog-1", "courseId": "course-1", ... },
 *       "order": 0,
 *       "lessons": [
 *         {
 *           "lesson": { "id": "lesson-1", "programId": "prog-1", ... },
 *           "order": 0,
 *           "scenarios": [
 *             {
 *               "scenario": { "id": "scen-1", "title": "Базовые слова", ... },
 *               "order": 0,
 *               "cards": [
 *                 {
 *                   "card": { "id": "card-1", "kind": "select", ... },
 *                   "order": 0,
 *                   "meta": { "pinyin": "zhuō zi", "tones": [1, 5], "difficulty": "beginner", "tags": [...] }
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 */
export type CourseBundle = {
  /** Версия формата: `2` для новой структуры. */
  formatVersion: 2;
  /** ISO 8601 timestamp экспорта. */
  exportedAt: string;
  /** ID автора из localStorage (обычно 'local-user'). */
  sourceAuthorId?: string;
  /** Единственный курс (не массив). */
  course: Course;
  /** Программы на верхнем уровне с порядком. */
  programs: ProgramBundle[];
};

/**
 * Программа с вложенными уроками и порядком.
 *
 * @remarks
 * `courseId` is omitted in the bundle — context is known from the parent Course.
 */
export type ProgramBundle = {
  /** Program with cross-entity references removed (courseId is omitted). */
  program: Omit<Program, 'courseId'>;
  /** Порядок программы в курсе. */
  order: number;
  /** Вложенные уроки. */
  lessons: LessonBundle[];
};

/**
 * Урок с вложенными сценариями и порядком.
 *
 * @remarks
 * `programId` and `courseId` are omitted — context is known from parent Program/Course.
 */
export type LessonBundle = {
  /** Lesson with cross-entity references removed (programId, courseId are omitted). */
  lesson: Omit<Lesson, 'programId' | 'courseId'>;
  /** Порядок урока в программе. */
  order: number;
  /** Вложенные сценарии. */
  scenarios: ScenarioBundle[];
};

/**
 * Сценарий с вложенными карточками и порядком.
 *
 * @remarks
 * `lessonId`, `courseId`, and `programId` are omitted — context is known from parent Lesson/Program/Course.
 */
export type ScenarioBundle = {
  /** Scenario with cross-entity references removed (lessonId, courseId, programId are omitted). */
  scenario: Omit<Scenario, 'lessonId' | 'courseId' | 'programId'>;
  /** Порядок сценария в уроке. */
  order: number;
  /** Вложенные карточки. */
  cards: CardBundle[];
};

/**
 * Карточка с порядком и объединёнными метаданными.
 *
 * @remarks
 * `courseId`, `lessonId`, `scenarioId`, and `programId` are omitted — context is known from parent Scenario/Lesson/Program/Course.
 */
export type CardBundle = {
  /** Card with cross-entity references removed (courseId, lessonId, scenarioId, programId are omitted). */
  card: Omit<Card, 'courseId' | 'lessonId' | 'scenarioId' | 'programId'>;
  /** Порядок карточки в сценарии. */
  order: number;
  /** Объединённые метаданные (card.meta + cardIndexMeta). */
  meta: CardIndexMetaOverride;
};

// ──────────────────────────────────────────────
// CourseBundle v1 — обратная совместимость
// ──────────────────────────────────────────────

/**
 * Корневой тип пакета курса (формат v1, плоские массивы).
 *
 * @remarks
 * Старый формат для обратной совместимости. При импорте конвертируется во внутреннее представление v2.
 */
export type CourseBundleV1 = {
  /** Всегда `1` для формата v1. */
  formatVersion: 1;
  /** ISO 8601 timestamp экспорта. */
  exportedAt: string;
  /** ID автора из localStorage. */
  sourceAuthorId?: string;
  /** Плоские массивы: курсы, программы, уроки. */
  course: {
    courses: Course[];
    programs: Program[];
    lessons: Lesson[];
  };
  /** Все сценарии, referenced by the course's lessons. */
  scenarios: Scenario[];
  /** Все карточки, referenced by the scenarios. */
  cards: Card[];
  /** Мета-данные карточек из cardIndexMeta. */
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};

/**
 * Объединённый тип CourseBundle — поддерживает v1 и v2.
 */
export type CourseBundleTyped = CourseBundleV1 | CourseBundle;

// ──────────────────────────────────────────────
// Валидация и ошибки
// ──────────────────────────────────────────────

/**
 * Результат валидации CourseBundle перед экспортом/импортом.
 */
export type CourseBundleValidation = {
  /** Прошла ли пакет валидацию. */
  valid: boolean;
  /** Список сообщений об ошибках, если валидация не пройдена. */
  errors: readonly string[];
};

/**
 * Ошибка, блокирующая экспорт пакета курса.
 *
 * @remarks
 * Коды ошибок: `criteria-scenario` — criteria-сценарий не поддерживается;
 * `missing-lesson` — урок не найден в пакете; `missing-scenario` — сценарий не найден;
 * `missing-card` — карточка не найдена; `missing-meta` — метаданные карточки не найдены.
 */
export type CourseBundleError = {
  /** Код ошибки, определяющий тип нарушения валидации. */
  code:
    | 'criteria-scenario'
    | 'missing-lesson'
    | 'missing-scenario'
    | 'missing-card'
    | 'missing-meta'
    | 'invalid-order'
    | 'unsupported-format';
  /** Человек-readable сообщение об ошибке. */
  message: string;
  /** ID сущности, вызвавшей ошибку. */
  entityId: string;
};
