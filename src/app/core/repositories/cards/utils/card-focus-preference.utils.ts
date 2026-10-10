/** Флаг полноэкранного режима фокуса на карточку по умолчанию. */
export const DEFAULT_CARD_FOCUS_FULLSCREEN = false;

/** Нормализует произвольное значение в булево `true` только для строгого `true`. */
export function normalizeCardFocusFullscreen(value: unknown): boolean {
  return value === true;
}
