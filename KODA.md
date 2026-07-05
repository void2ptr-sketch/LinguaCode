# KODA.md — Инструкции для AI-ассистента

## О проекте

**LinguaCode** — приложение для изучения языков (от естественных до искусственных). Основная единица обучения — **карточка** (10 типов). Карточки → сценарии → уроки → программы.

- **Репозиторий:** `void2ptr-sketch/LinguaCode`
- **Стек:** Angular 19, TypeScript, Angular Material, SCSS, Signal API
- **Статус:** MVP выполнен, активный бэклог G9g–G14
- **Требования:** Node.js 20+, npm 10+, Angular CLI 19+

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `README.md` | Обзор, быстрый старт, стек |
| `TASKS.md` | Чеклист задач и бэклога |
| `docs/INDEX.md` | Оглавление документации |
| `docs/DOMAIN.md` | Сущности, модели, терминология |
| `docs/ARCHITECTURE.md` | Технические решения |
| `docs/.gitrules.md` | Правила веток и коммитов |
| `.cursorrules` | Базовые правила стиля |

## Архитектура

### Структура `src/app/`

```
src/app/
├── core/
│   ├── layout/          # shell (header, nav, main-layout, footer)
│   ├── models/          # типы: Card, Scenario, Course, Lesson, …
│   ├── state/           # UserStore, LearningResultsStore
│   ├── data/            # repositories, overlay, content seed, hanzi-engine
│   └── api/             # HttpClient, interceptors, mock handlers
├── shared/              # переиспользуемые UI и утилиты
│   ├── pagination/      # PageRequest, PageResponse, UiPaginationComponent
│   ├── card-catalog-search/ # фильтры, ScenarioCardPickerComponent
│   └── components/      # CardHost, cards/*, pinyin-keyboard
├── features/            # изолированные фичи (card-select, card-editor, …)
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

### Контент

- **Системный seed:** `public/data/` + `content-manifest.json`
- **Пользовательский overlay:** `localStorage` (ключ `lingua-code.user-content.v1`)
- **Mock-данные:** `all-*.json` файлы, маппинг в `load-file-mock.config.ts`

### Управление состоянием

- **Signals** — основной механизм (Angular 19 signal-based services)
- **RxJS** — только для HTTP/WebSocket
- **Статус задач:** `TASKS.md` — чеклист G1–G14

## Правила разработки

### Код

1. **Standalone компоненты** — никаких `NgModule`
2. **Signal API** — вместо RxJS где возможно
3. **TypeScript `type`** — вместо `interface`
4. **SCSS** — стили, layout на CSS Grid (`grid-template-areas`)
5. **Angular Material** — UI-компоненты, тема `azure-blue`
6. **Фичи** — изолированные подпапки в `features/` (компонент, сервис, типы отдельно)

### Git workflow

1. От `main` → ветка `NUMBER_description` (напр. `14_authoring-migration`)
2. Коммиты: `[NUMBER_description] краткое описание`
3. Merge в `main`, ветку не удалять
4. Полные правила: `docs/.gitrules.md`

### Команды

| Команда | Описание |
|---------|----------|
| `npm start` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm test` | Unit-тесты (Karma) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run verify` | lint + sync:hanzi + build + test |
| `npm run export:content-seed` | Экспорт overlay → seed |
| `npm run import:course-bundle` | Импорт CourseBundle JSON |

### Скрипты данных

| Скрипт | Назначение |
|--------|-----------|
| `scripts/export-content-seed.mjs` | Генерация seed из `perl-interview-idea.md` |
| `scripts/merge-mock-data.mjs` | Объединение `*-course.json` → `all-courses.json` |
| `scripts/import-course-bundle.mjs` | Импорт CourseBundle в seed |
| `scripts/migrate-authoring.mjs` | Миграция полей `authoring` между файлами |
| `scripts/generate-radicals-course.mjs` | Генерация курса радикалов |

## Domain модели

### Иерархия контента

```
Card (10 типов)
  → Scenario (группа карточек)
    → Lesson (группа сценариев)
      → Course (группа уроков)
```

### Типы карточек

`select`, `code-select`, `keyboard`, `draw`, `memory`, `tone`, `reading`, `symbol`, `sound`, `symbol`

### Authoring (Course)

```typescript
type CourseAuthoring = {
  idea: string;              // Markdown-описание программы
  status: CourseAuthoringStatus;  // 'draft' | 'planned' | 'generating' | 'materialized' | 'failed'
  ideaUpdatedAt?: string;    // ISO 8601
  materializedAt?: string;   // ISO 8601
  lastError?: string;        // при status === 'failed'
};
```

## Важные ограничения

1. **Никаких секретов/токенов** в коде и коммитах
2. **Не добавлять** copyright/license без явного запроса
3. **Не удалять** несвязанные баги/тесты вне текущего запроса
4. **Исправлять корневую причину**, а не обходным путём
5. **Обновлять документацию** при изменениях API/поведения
6. **Показывать только изменённые участки** кода (≠ полный файл)
7. **Кратко объяснять** изменения, не дублировать старт/концовку

## Поиск информации

- Документация: `docs/INDEX.md`
- Задачи: `TASKS.md`
- Git-правила: `docs/.gitrules.md`
- Архитектура: `docs/ARCHITECTURE.md`
- Домен: `docs/DOMAIN.md`
- Бизнес: `docs/BUSINESS.md`

## Миграции данных

При работе с `public/data/courses/`:
- Старые файлы: `{slug}-course.json` (формат `{courses, lessons}`)
- Единый файл: `all-courses.json` (формат `[{...}]`)
- Manifest: `content-manifest.json` (список файлов)
- Поля `authoring.status` и `authoring.ideaUpdatedAt` — критичны, не терять при миграции

## Когда сомневаетесь

1. Проверьте `TASKS.md` — актуальный статус задач
2. Проверьте `docs/` — документация по домену/архитектуре
3. Изучите существующий код в похожих фичах
4. Не предполагайте наличие библиотек без проверки
5. Задавайте уточняющий вопрос только при реальной неоднозначности
