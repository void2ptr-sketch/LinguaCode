// Shared layer — public API
// ⚠️ ПРАВИЛО: shared содержит только универсальный код.
// Запрещено:
//   - Импортировать из features/
//   - Добавлять доменную логику (HTTP-сервисы, бизнес-правила)
// Разрешено:
//   - UI-компоненты (dumb components)
//   - Утилиты (чистые функции)
//   - Типы и константы
//   - Директивы и пайпы

export * from './constants';
export * from './types';
export * from './utils';
export * from './ui/card-host';
export * from './ui/chinese';
export * from './ui/course-picker';
export * from './ui/lesson-picker';
export * from './ui/scenario-picker';
