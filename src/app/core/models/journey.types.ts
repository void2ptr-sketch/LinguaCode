/** Status of a location node on the learning journey map. */
export type JourneyLocationStatus = 'locked' | 'available' | 'in-progress' | 'visited' | 'completed';

/** Content type of a scenario — determines the icon displayed on the journey map. */
export type JourneyContentType = 'theory' | 'practice' | 'test' | 'video' | 'case';

/**
 * Maps card kind values to journey content types.
 *
 * @remarks
 * Used to determine the icon and categorization of scenario nodes on the journey map.
 */
export const CARD_KIND_TO_CONTENT_TYPE: Record<string, JourneyContentType> = {
  select: 'theory',
  'code-select': 'test',
  symbol: 'theory',
  reading: 'theory',
  memory: 'practice',
  sound: 'practice',
  timed: 'test',
  keyboard: 'practice',
  draw: 'practice',
  tone: 'practice',
};

/**
 * A node representing a scenario location on the learning journey map.
 *
 * @remarks
 * Contains progress information, metadata, and user interaction state for each location.
 */
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
  /** Типы контента, вычисленные из карточек сценария. */
  contentTypes: JourneyContentType[];
};

/**
 * Analytics event for a journey location.
 *
 * @remarks
 * Three event kinds are tracked: visit, duration, and completion.
 */
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

/** Explorer level badge awarded based on journey activity. */
export type ExplorerLevel = 'novice' | 'experienced' | 'expert';

/**
 * Result of explorer level computation.
 *
 * @remarks
 * Includes the current level, totals, and the next milestone thresholds.
 */
export type ExplorerLevelResult = {
  level: ExplorerLevel;
  totalVisits: number;
  totalCompleted: number;
  nextMilestone: {
    visitsNeeded: number;
    completedNeeded: number;
  };
};
