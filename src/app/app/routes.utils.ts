import { Routes } from '@angular/router';

/**
 * Объединяет массивы Routes в один конфигурационный массив.
 * Используется в `app.routes.ts` для сборки финальных маршрутов
 * из feature-specific route configs.
 */
export function mergeRoutes(...configs: Routes[]): Routes {
  return configs.flat();
}
