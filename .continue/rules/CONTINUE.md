---
description: LinguaCode Project Guide
lastReviewed: 2026-10-18
reviewInterval: 90d   # the period after which the assistant is required to double‑check the facts
---

## 1. Project Overview

**LinguaCode** — это Angular-приложение для изучения языков с акцентом на карточный и курсовой подходы к обучению. Приложение поддерживает ввод Pinyin с тоновыми маркировками, рисование иероглифов (hanzi), фонетическую транскрипцию (IPA) и интерактивные сценарии обучения.

### Ключевые технологии
- **Angular 22+** — standalone components, signals, lazy `loadComponent` routes
- **TypeScript 6+** — strict mode, `type` aliases вместо `interface` для данных
- **RxJS 7+** — внешние потоки; локальное состояние управляется через Signals
- **Angular Material** — UI-компоненты
- **Vitest** — unit-тесты (`types: ["vitest/globals"]`, runner `vitest`)
- **Prettier & ESLint** — форматирование и линтинг

### Высокоуровневая архитектура (FEEDS / FSD-подобная)
- **`src/app/entities/`** — доменные сущности: карточки, курсы, треки (программы), сценарии, китайский язык (hanzi, pinyin, phonetics), пользователь, аутентификация. Содержит модели, репозитории, утилиты и UI-компоненты сущностей.
- **`src/app/features/`** — изолированные фичи (редактор карточек, выбор карточек, каталог курсов, домашняя страница, путь обучения, builder сценариев). Каждая фича содержит компоненты, сервисы, типы и утилиты.
- **`src/app/pages/`** — страницы приложения (layout shell, home, journey, card-select, course-catalog, help, user). Страницы загружаются лениво через `loadComponent`.
- **`src/app/widgets/`** — переиспользуемые виджеты: main-layout, header, footer, sidebar-навигация, меню (карточки, помощь, инструменты, пользователь).
- **`src/app/shared/`** — общие сервисы и утилиты: API, логирование, безопасность (санитизация), хранилище (IndexedDB), синхронизация (sync queue), темы, типы, UI-компоненты, утилиты (pagination, markdown-field).

---

## 2. Getting Started

### Требования
- **Node.js** 24 LTS (см. `.nvmrc`)
- **npm** 10+
- **Angular CLI** 22+
- **TypeScript** 6+

### Установка
```bash
npm install
```

### Базовое использование
```bash
# Dev-сервер
ng serve

# Production build
ng build --configuration production

# Unit-тесты (Vitest)
ng test

# CI-режим тестов
npm run test:ci
```

### Дополнительные скрипты
| Скрипт | Описание |
|--------|----------|
| `npm run lint` | Проверка линтером |
| `npm run lint:fix` | Автофикс линтера |
| `npm run format` | Проверка форматирования Prettier |
| `npm run format:fix` | Запись форматирования Prettier |
| `npm run verify` | Полный пайплайн: lint + audit FSD + проверка импортов + barrel-экспорты + sync hanzi + build + тесты |
| `npm run export:content-seed` | Экспорт seed-данных контента |
| `npm run generate:radicals-course` | Генерация курса радикалов |

---

## 3. Project Structure

```
src/
├── app/
│   ├── entities/             # Доменные сущности
│   │   ├── auth/             # Аутентификация, store
│   │   ├── card/             # Карточки: модели, репозиторий, поиск, UI-компоненты
│   │   ├── chinese/          # Китайский язык: hanzi, pinyin, phonetics, tone-marks
│   │   ├── content-seed/     # Seed-данные контента
│   │   ├── course/           # Курсы
│   │   ├── journey/          # Путь обучения
│   │   ├── language-pair/    # Языковые пары
│   │   ├── learning/         # Обучение, dashboard
│   │   ├── lesson/           # Уроки
│   │   ├── phonetic/         # Фонетика (IPA)
│   │   ├── scenario/         # Сценарии обучения
│   │   └── user/             # Пользователь, overlay-миграции
│   ├── features/             # Изолированные фичи
│   │   ├── card-editor/      # Редактор карточек
│   │   ├── card-select/      # Выбор карточек и тренировка
│   │   ├── course-builder/   # Конструктор курсов
│   │   ├── course-catalog/   # Каталог курсов
│   │   ├── home/             # Домашняя страница
│   │   ├── journey/          # Путь обучения
│   │   ├── learning-results/# Результаты обучения
│   │   └── scenario-builder/# Конструктор сценариев
│   ├── pages/                # Страницы (layout shell, routing)
│   │   ├── card-editor/      # CardEditorPageComponent
│   │   ├── card-select/      # CardSelectPageComponent
│   │   ├── course-builder/   # CourseBuilderPageComponent
│   │   ├── course-catalog/   # CourseCatalogPageComponent
│   │   ├── help/             # HelpPageComponent
│   │   ├── home/             # HomePageComponent
│   │   ├── journey/          # JourneyPageComponent
│   │   ├── scenario-builder/# ScenarioBuilderPageComponent
│   │   └── user/             # UserPageComponent
│   ├── shared/               # Общие сервисы и утилиты
│   │   ├── api/              # API-утилиты, network status
│   │   ├── logger/           # Логирование
│   │   ├── security/         # Санитизация ввода
│   │   ├── storage/          # IndexedDB сервис
│   │   ├── sync/             # Sync queue (offline mutations)
│   │   ├── theme/            # Типы тем
│   │   ├── types/            # Общие типы (async-state)
│   │   ├── ui/               # UI-компоненты (error-toast)
│   │   └── utils/            # Утилиты (pagination, markdown-field)
│   ├── widgets/              # Переиспользуемые виджеты
│   │   ├── active-language-pair-switcher/ # Переключатель языковой пары
│   │   ├── main-footer/      # Footer
│   │   ├── main-header/      # Header
│   │   ├── main-layout/      # Shell layout
│   │   ├── menu-cards/       # Меню карточек
│   │   ├── menu-help/        # Меню помощи
│   │   ├── menu-tools/       # Меню инструментов
│   │   ├── menu-user/        # Меню пользователя
│   │   └── sidebar-navigation-left/ # Боковая навигация
│   ├── app.component.ts      # Root component
│   ├── app.config.ts         # Application configuration
│   ├── app.routes.ts         # Routing (только loadComponent)
│   └── errors/               # Global error handler
├── assets/                   # Статические ресурсы
└── environments/             # Environment configurations
```

### Ключевые файлы и их роли
- **`src/main.ts`** — Точка входа приложения
- **`src/app/app.config.ts`** — Конфигурация приложения (providers, initializers, preloading content seed, auth session restore)
- **`src/app/app.routes.ts`** — Маршрутизация (все фичи загружаются лениво через `loadComponent`)
- **`angular.json`** — Build/test targets (`@angular/build:unit-test`, Vitest runner)
- **`tsconfig.json`** — TypeScript strict mode, Vitest globals

---

## 4. Development Workflow

### Стандарты кодирования

1. **Только standalone components** — никогда не используйте NgModules
2. **TypeScript Strict Mode** — строгая типизация, предпочитайте `type` над `interface` для данных
3. **Signals для локального состояния** — RxJS только для внешних потоков (см. `03.angular.03.reactive.rule.md`)
4. **Названия файлов** — kebab-case с суффиксом типа (`user-profile.component.ts`, `user.service.ts`)
5. **Названия классов** — UpperCamelCase с суффиксом (`UserProfileComponent`, `UserService`)
6. **Константы** — UPPER_CASE (`MAX_RETRY_COUNT`)
7. **Переменные и методы** — camelCase (`userId`, `calculateTotal()`)

### Подход к тестированию
- **Unit-тесты** через **Vitest** (`*.spec.ts`, runner `vitest` в `angular.json`)
- Мокайте внешние зависимости вместо вызова реальных эндпоинтов
- Тестируйте: инициализацию компонентов, input/output bindings, реактивные потоки (observables, signals), обработку ошибок
- Целевые пороги покрытия: statements 80%, branches 80%, functions 80%, lines 80%

### Процесс сборки и деплоя
- Production builds с tree-shaking и оптимизацией
- Автоматическое тестирование в CI/CD пайплайне
- Проверка качества кода и безопасности
- Конфигурации, специфичные для окружения (development / production)

---

## 5. Key Concepts

### Терминология домена
- **Card** — единица обучения, содержащая языковой контент
- **Course** — коллекция карточек, организованных для прогрессивного обучения
- **Scenario** — интерактивный контекст обучения с несколькими карточками
- **Learning Session** — активная учебная деятельность пользователя
- **Content Seed** — начальные данные, загружаемые в приложение

### Основные абстракции
1. **Signals** — для локального управления состоянием вместо RxJS subjects
2. **Lazy Loading** — страницы фич загружаются по требованию через `loadComponent`
3. **Standalone Components** — без NgModules, зависимости через `imports` array
4. **Repository Pattern** — абстракция доступа к данным через репозитории

### Используемые паттерны проектирования
- **Repository Pattern** — для персистентности и доступа к данным
- **Signal-based State Management** — локальное управление состоянием компонентов
- **Lazy Loading** — загрузка компонентов на уровне маршрутов
- **Component Composition** — переиспользуемые UI-компоненты с чёткими интерфейсами

---

## 6. Common Tasks

### Добавление новой фичи
1. Создайте папку фичи в `src/app/features/<feature-name>/`
2. Реализуйте standalone компоненты с правильными `imports`
3. Добавьте конфигурацию маршрута в `app.routes.ts` через `loadComponent`
4. Используйте signals для локального состояния
5. Напишите тесты (Vitest)

### Работа с моделями данных
1. Определите типы в папке фичи или в `src/app/entities/` (для глобальных моделей)
2. Создайте репозитории/сервисы для доступа к данным
3. Используйте DI Angular (`providedIn: 'root'`)
4. Реализуйте обработку ошибок и валидацию

### Модификация UI-компонентов
1. Создайте или измените standalone компоненты в соответствующих папках
2. Используйте component-scoped стили (SCSS файлы)
3. Реализуйте правильные input/output bindings
4. Следуйте существующим паттернам дизайна и стилям

### Работа с Pinyin клавиатурой
Компонент `PinyinKeyboardComponent` (`src/app/entities/chinese/ui/pinyin-keyboard/`) предоставляет экранную клавиатуру для ввода Pinyin с тоновыми маркировками:
- Поддерживает committed syllables, pending syllables, tone marks и tone preview
- Тональные кнопки динамически меняются в зависимости от нажатых клавиш
- Интегрируется через `[(value)]` двухстороннее связывание
- Использует `ChangeDetectionStrategy.OnPush` для производительности

### Работа с Hanzi (иероглифы)
- **Hanzi Character Model** (`src/app/entities/chinese/model/hanzi-character.model.ts`) — модель иероглифа с штрихами
- **Drawing Engine** — рисование иероглифов с поддержкой tracing, hints, calligraphy paint
- **Quiz Session** (`src/app/entities/chinese/lib/quiz/hanzi-quiz-session.ts`) — сессии тестирования иероглифов
- **Tone Marks** (`src/app/entities/chinese/lib/tone-marks/`) — применение тоновых маркировок к Pinyin

---

## 7. Troubleshooting

### Частые проблемы
- **Ошибки сборки**: проверьте конфигурацию TypeScript и зависимости
- **Runtime ошибки**: проверьте импорты компонентов и lifecycle hooks
- **Проблемы производительности**: профилируйте change detection и оптимизируйте вычисления
- **Проблемы lazy loading**: убедитесь в правильной конфигурации маршрутов

### Советы по отладке
1. Используйте Angular DevTools для инспекции компонентов
2. Используйте инструменты разработчика браузера для сетевых запросов
3. Реализуйте правильное логирование в репозиториях и сервисах
4. Тестируйте с минимальными воспроизводимыми примерами

---

## 8. References

### Документация проекта
- [`docs/INDEX.md`](../../docs/INDEX.md) — оглавление всей документации
- [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — обзор архитектуры
- [`docs/COMMON/DOMAIN.md`](../../docs/COMMON/DOMAIN.md) — доменная модель
- [`docs/COMMON/CARD-CATALOG.md`](../../docs/COMMON/CARD-CATALOG.md) — индекс карточек
- [`docs/CONTENT/CJK-CONTENT.md`](../../docs/CONTENT/CJK-CONTENT.md) — иероглифы, пиньинь, тоны
- [`docs/CONTENT/PHONETIC-CONTENT.md`](../../docs/CONTENT/PHONETIC-CONTENT.md) — IPA
- [`docs/API-CONTRACT.md`](../../docs/API-CONTRACT.md) — HTTP API
- [`docs/SYSTEM/GIT-RULES.md`](../../docs/SYSTEM/GIT-RULES.md) — Git workflow
- [`TASKS.md`](../../TASKS.md) — чеклист задач

### Архитектура подсистем
- [`docs/ARCHITECTURE/ARCHITECTURE.program.md`](../../docs/ARCHITECTURE/ARCHITECTURE.program.md) — учебные треки (`Program`)
- [`docs/ARCHITECTURE/ARCHITECTURE.course.md`](../../docs/ARCHITECTURE/ARCHITECTURE.course.md) — программы и каталог
- [`docs/ARCHITECTURE/ARCHITECTURE.card-select.md`](../../docs/ARCHITECTURE/ARCHITECTURE.card-select.md) — практика
- [`docs/ARCHITECTURE/ARCHITECTURE.home.md`](../../docs/ARCHITECTURE/ARCHITECTURE.home.md) — dashboard

### Внешняя документация
- [Angular Documentation](https://angular.dev/docs)
- [Angular Material Documentation](https://material.angular.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

### Важные ресурсы
- ESLint конфигурация для качества кода
- Prettier конфигурация для форматирования
- Vitest suite documentation

### Ссылки на правила проекта

Правила именуются по схеме `NN.domain.NZ.name.rule.md`: `NN` — номер домена (01=meta, 02=architecture, 03=angular, 04=design, 05=business), `NZ` — номер сортировки внутри домена (см. `01.meta.09.rules-maintenance.rule.md`).

#### meta — процесс и инструменты
- `.continue/rules/01.meta.01.agent-behavior.rule.md` — поведение агента, границы доступа к файлам
- `.continue/rules/01.meta.02.validate-write-arguments.rule.md` — валидация аргументов write-инструментов
- `.continue/rules/01.meta.03.git-workflow.rule.md` — Git workflow (ветки, коммиты)
- `.continue/rules/01.meta.04.tasks-workflow.rule.md` — workflow с `TASKS.md`
- `.continue/rules/01.meta.05.verification-checklist.rule.md` — чек-лист верификации
- `.continue/rules/01.meta.06.docs-conventions.rule.md` — конвенции документации `docs/`
- `.continue/rules/01.meta.07.ci-parity.rule.md` — паритет локальных проверок и CI
- `.continue/rules/01.meta.08.dependencies.rule.md` — управление зависимостями
- `.continue/rules/01.meta.09.rules-maintenance.rule.md` — поддержка правил в актуальном состоянии
- `.continue/rules/01.meta.10.anti-looping.rule.md` — предотвращение зацикливания (повтор команд/вызовов без прогресса)
- `.continue/rules/01.meta.11.rag.rule.md` — RAG: поиск в интернете в сложных случаях вместо догадок
- `.continue/rules/01.meta.12.built-in-tools.rule.md` — встроенные инструменты (Continue "Built-in Tools", MCP)
- `.continue/rules/01.meta.13.rules-lifecycle.rule.md` — жизненный цикл правил: триггеры обновления, ревью-цикл, changelog

#### architecture — структура проекта
- `.continue/rules/02.architecture.01.project-architecture.rule.md` — архитектура проекта, FSD-слои
- `.continue/rules/02.architecture.02.lazy-loading.rule.md` — lazy loading маршрутов (`loadComponent`)
- `.continue/rules/02.architecture.03.di-providers.rule.md` — DI и provider rules
- `.continue/rules/02.architecture.04.fsd-imports.rule.md` — FSD-слои и направления импортов
- `.continue/rules/02.architecture.05.routing.rule.md` — маршрутизация, guards
- `.continue/rules/02.architecture.06.component-patterns.rule.md` — OnPush, `inject()`, жизненный цикл
- `.continue/rules/02.architecture.07.stores.rule.md` — signal-based stores (`*.store.ts`)
- `.continue/rules/02.architecture.08.migration-standalone.rule.md` — миграция на standalone

#### angular — код на Angular
- `.continue/rules/03.angular.01.senior-developer.rule.md` — свод правил senior-разработчика
- `.continue/rules/03.angular.02.build.rule.md` — сборка и оптимизация (Ivy)
- `.continue/rules/03.angular.03.reactive.rule.md` — реактивные паттерны (Signals vs RxJS)
- `.continue/rules/03.angular.04.typescript.rule.md` — TypeScript и строгость типов
- `.continue/rules/03.angular.05.testing-strategy.rule.md` — тестирование и пороги покрытия
- `.continue/rules/03.angular.06.code-style.rule.md` — стиль кода и форматирование
- `.continue/rules/03.angular.07.naming.rule.md` — соглашения о названиях, когезивные модули
- `.continue/rules/03.angular.08.config-editing.rule.md` — правка конфиг-файлов (`angular.json`, `tsconfig`)
- `.continue/rules/03.angular.09.control-flow.rule.md` — control flow (`@if`/`@for`/`@switch`/`@defer`/`@let`)
- `.continue/rules/03.angular.10.signal-inputs.rule.md` — signal inputs / `model()` / `output()`
- `.continue/rules/03.angular.11.forms.rule.md` — формы (template-driven, dirty-state)
- `.continue/rules/03.angular.12.smoke-conformance.rule.md` — smoke и conformance тесты
- `.continue/rules/03.angular.13.performance.rule.md` — производительность (бюджеты, `@defer`, track)

#### design — UI и UX
- `.continue/rules/04.design.01.styles.rule.md` — SCSS/CSS-конвенции
- `.continue/rules/04.design.02.a11y.rule.md` — доступность (a11y)
- `.continue/rules/04.design.03.dialogs.rule.md` — модальные диалоги (MatDialog)
- `.continue/rules/04.design.04.i18n.rule.md` — локализация UI (RU-строки)

#### business — домен и данные
- `.continue/rules/05.business.01.security.rule.md` — безопасность
- `.continue/rules/05.business.02.data-content.rule.md` — данные/контент (seed, overlay)
- `.continue/rules/05.business.03.errors-http.rule.md` — обработка ошибок и HTTP-слой
- `.continue/rules/05.business.04.pwa.rule.md` — PWA / service worker
- `.continue/rules/05.business.05.env-api-contract.rule.md` — окружение и API-контракт
- `.continue/rules/05.business.06.backend-coordination.rule.md` — координация с бэкендом (java.LinguaCode)
- `.continue/rules/05.business.07.auth.rule.md` — аутентификация (AuthStore, токены, guards)
- `.continue/rules/05.business.08.storage.rule.md` — хранение (IndexedDB, localStorage, persistence)

#### Obsolete rules — архив заменённых правил

Правило, которое заменено или удалено, **не удаляется молча**: его запись переносится сюда с указанием замены (см. `01.meta.13.rules-lifecycle.rule.md`). Это предотвращает «правила-зомби», которые продолжают цитироваться, но файла уже нет.

| Устаревшее правило | Замена | Дата |
| ------------------ | ------ | ---- |
| *(пока нет)* | | |

---


## 9. Barrel Exports (`index.ts`)

### Правила для `index.ts`

| Сценарий | Нужен `index.ts`? |
|----------|-------------------|
| Когезивный модуль (component + utils + types + tests) | **Да** |
| Корень фичи (`src/app/features/<name>/`) | **Да** |
| Папка с несколькими экспортами разных типов | **Да** |
| Один экспорт + используется в `export * as` в родительском `index.ts` | **Да** |
| Один экспорт + нет namespace-потребителей | **Нет** |

### Порядок экспортов внутри `index.ts`
1. **Components** — компоненты
2. **Services / Stores / Directives / Pipes** — сервисы и stores
3. **Utils / Types / Constants** — утилиты, типы, константы

### Пример шаблона `index.ts`
```ts
// ===== Components =====
export { FirstComponent } from './first.component';
export { SecondComponent } from './second.component';

// ===== Services =====
export { FirstService } from './first.service';
export { SecondService } from './second.service';

// ===== Utils / Types =====
export type { FirstType } from './first.types';
export { formatLabel } from './format.util';
```

> Когезивные модули (папки, которые нельзя разделять) и правила публичного API слайсов — см. `03.angular.07.naming.rule.md` и `02.architecture.04.fsd-imports.rule.md`.

---

## 10. Security Rules

> Полные правила безопасности — см. `05.business.01.security.rule.md` (санитизация, секреты, `npm run audit`, PWA-кэширование).

---

## 11. Testing Rules

> Полные правила тестирования и пороги покрытия (statements 80%, branches 80%, functions 80%, lines 80%) — см. `03.angular.05.testing-strategy.rule.md`.

---

## 12. Migration Notes

> Полные правила миграции с NgModule на standalone — см. `02.architecture.08.migration-standalone.rule.md` и [Angular Standalone Migration Guide](https://angular.dev/reference/migrations/standalone).
