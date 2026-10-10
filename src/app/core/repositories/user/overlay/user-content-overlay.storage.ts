import type { UserContentOverlay } from './user-content-overlay.types';
import {
  USER_CONTENT_OVERLAY_KEY,
  USER_CONTENT_OVERLAY_VERSION,
} from './user-content-overlay.types';

/**
 * Создаёт пустой оверлей с версией по умолчанию и пустыми коллекциями.
 *
 * @returns Пустой объект UserContentOverlay, готовый к заполнению.
 */
export function emptyUserContentOverlay(): UserContentOverlay {
  return {
    version: USER_CONTENT_OVERLAY_VERSION,
    courses: {},
    lessons: {},
    scenarios: {},
    cards: {},
    cardIndexMeta: {},
    deletedSystemIds: {},
  };
}

/**
 * Читает оверлей из localStorage.
 *
 * @remarks
 * Если ключ отсутствует или данные некорректны — возвращает пустой оверлей.
 * Не выбрасывает исключения: все ошибки парсинга обрабатываются silently.
 *
 * @returns Оверлей из localStorage или пустой оверлей при отсутствии/ошибке.
 */
export function readUserContentOverlay(): UserContentOverlay {
  const raw = localStorage.getItem(USER_CONTENT_OVERLAY_KEY);
  if (!raw) {
    return emptyUserContentOverlay();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserContentOverlay>;
    return normalizeUserContentOverlay(parsed);
  } catch {
    return emptyUserContentOverlay();
  }
}

/**
 * Сохраняет оверлей в localStorage.
 *
 * @remarks
 * Перед записью нормализует данные через normalizeUserContentOverlay.
 *
 * @param overlay — оверлей для сохранения.
 */
export function writeUserContentOverlay(overlay: UserContentOverlay): void {
  localStorage.setItem(
    USER_CONTENT_OVERLAY_KEY,
    JSON.stringify(normalizeUserContentOverlay(overlay)),
  );
}

/**
 * Применяет частичное обновление к оверлею и сохраняет результат.
 *
 * @remarks
 * Считывает текущий оверлей из localStorage, объединяет с патчем,
 * нормализует и записывает обратно. Версия не может быть изменена через патч.
 *
 * @param patch — частичные изменения для применения.
 * @returns Обновлённый оверлей, сохранённый в localStorage.
 */
export function patchUserContentOverlay(
  patch: Partial<Omit<UserContentOverlay, 'version'>>,
): UserContentOverlay {
  const next = normalizeUserContentOverlay({
    ...readUserContentOverlay(),
    ...patch,
  });
  writeUserContentOverlay(next);
  return next;
}

function normalizeUserContentOverlay(value: Partial<UserContentOverlay>): UserContentOverlay {
  return {
    version: USER_CONTENT_OVERLAY_VERSION,
    courses: value.courses && typeof value.courses === 'object' ? { ...value.courses } : {},
    lessons: value.lessons && typeof value.lessons === 'object' ? { ...value.lessons } : {},
    scenarios: value.scenarios && typeof value.scenarios === 'object' ? { ...value.scenarios } : {},
    cards: value.cards && typeof value.cards === 'object' ? { ...value.cards } : {},
    cardIndexMeta:
      value.cardIndexMeta && typeof value.cardIndexMeta === 'object'
        ? { ...value.cardIndexMeta }
        : {},
    deletedSystemIds:
      value.deletedSystemIds && typeof value.deletedSystemIds === 'object'
        ? { ...value.deletedSystemIds }
        : {},
  };
}
