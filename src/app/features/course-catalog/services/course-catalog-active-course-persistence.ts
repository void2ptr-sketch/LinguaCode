import { COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY } from './course-catalog-active-course-persistence.types';

/**
 * Читает массив ID активных курсов из localStorage по ключу языковой пары.
 * Возвращает пустой массив при отсутствии/ошибке.
 */
export function readActiveCourseIds(pairId: string): string[] {
  const raw = localStorage.getItem(`${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.${pairId}`);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id: unknown): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Сохраняет массив ID активных курсов в localStorage.
 *
 * @param pairId — ID языковой пары для формирования ключа.
 * @param ids — массив ID активных курсов.
 */
export function writeActiveCourseIds(pairId: string, ids: readonly string[]): void {
  localStorage.setItem(
    `${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.${pairId}`,
    JSON.stringify([...ids]),
  );
}
