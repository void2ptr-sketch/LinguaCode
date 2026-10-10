// ===== Public API =====
// Компоненты
export { DrawCanvasComponent } from './components/draw-canvas';
export type { DrawRadicalHint } from './components/draw-canvas';
export { DrawCardComponent } from './components/draw-card';

// Сервисы
export { HanziDataService } from './services';

// ===== Internal exports (for barrel compatibility) =====
// Эти экспорты используются внутренними модулями и внешними зависимыми фичами.
// При рефакторинге обновляйте импорты через доменные barrel-индексы.

export * from './models';
export * from './utils/positioning';
export * from './utils/rendering';
export * from './utils/animation';
export * from './utils/validation';
export * from './utils/quiz';
