// Shared layer — public API
// ⚠️ ПРАВИЛО: shared содержит только универсальный код.
// Запрещено:
//   - Импортировать из features/, widgets/, pages/, entities/
//   - Добавлять доменную логику (HTTP-сервисы, бизнес-правила)
// Разрешено:
//   - UI-компоненты (dumb components)
//   - Утилиты (чистые функции)
//   - Типы и константы
//   - Директивы и пайпы

export * from './utils';
export * from './storage';
export * from './sync';
