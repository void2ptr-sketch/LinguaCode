import type { Lesson } from './lesson.types';

/** Статус локации на карте путешествия. */
export type JourneyLocationStatus = 'locked' | 'available' | 'in-progress' | 'visited' | 'completed';

/** Тип контента сценария — определяет иконку на карте. */
export type JourneyContentType = 'theory' | 'practice' | 'test' | 'video' | 'case';

/** Узел локации на карте путешествия. */
export type JourneyLocationNode = {
  /** Уникальный идентификатор локации. */
  id: string;
  /** Заголовок локации. */
  title: string;
  /** Краткое описание сценария. */
  description: string;
  /** Количество карточек в сценарии. */
  cardCount: number;
  /** Порядок в уроке/курсе. */
  order: number;
  /** Текущий статус локации. */
  status: JourneyLocationStatus;
  /** Тип контента для отображения иконки. */
  contentType: JourneyContentType;
  /** Идентификатор урока (страны), к которому относится локация. */
  lessonId: string;
  /** Заголовок урока. */
  lessonTitle: string;
  /** Идентификатор курса (пути), к которому относится локация. */
  courseId: string;
  /** Заголовок курса. */
  courseTitle: string;
  /** Процент завершения сценария (0–100). */
  completionPercent: number;
  /** Флаг: локация посещена пользователем. */
  visited: boolean;
  /** Флаг: локация в избранном. */
  favorite: boolean;
  /** Причина блокировки (если status === 'locked'). */
  blockReason: string | null;
  /** Идентификатор сценария. */
  scenarioId: string;
};

/** Событие аналитики для локации. */
export type JourneyAnalyticsEvent =
  | {
      kind: 'visit';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      timestamp: string;
    }
  | {
      kind: 'duration';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      durationMs: number;
      timestamp: string;
    }
  | {
      kind: 'complete';
      scenarioId: string;
      lessonId: string;
      courseId: string;
      completionPercent: number;
      timestamp: string;
    };

/** Уровень исследователя. */
export type ExplorerLevel = 'novice' | 'experienced' | 'expert';

/** Результат вычисления уровня исследователя. */
export type ExplorerLevelResult = {
  level: ExplorerLevel;
  totalVisits: number;
  totalCompleted: number;
  nextMilestone: {
    visitsNeeded: number;
    completedNeeded: number;
  };
};
