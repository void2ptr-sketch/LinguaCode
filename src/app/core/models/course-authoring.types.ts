/** Статус авторского пайплайна: идея → план → материализация в уроки/сценарии/карточки. */
export type CourseAuthoringStatus = 'draft' | 'planned' | 'generating' | 'materialized' | 'failed';

/** Авторский слой программы (`Course`): большой текст идеи, не для каталога ученика. */
export type CourseAuthoring = {
  /** Свободное описание идеи программы — основа для генерации структуры. */
  idea: string;
  status: CourseAuthoringStatus;
  /** ISO 8601 — когда идея последний раз менялась. */
  ideaUpdatedAt?: string;
  /** ISO 8601 — когда outline/уроки были материализованы (ручно или генератором). */
  materializedAt?: string;
  /** Последняя ошибка генерации (если status === 'failed'). */
  lastError?: string;
};

export const COURSE_AUTHORING_STATUSES: readonly CourseAuthoringStatus[] = [
  'draft',
  'planned',
  'generating',
  'materialized',
  'failed',
] as const;
