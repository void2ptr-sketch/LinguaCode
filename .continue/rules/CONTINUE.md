---
description: LinguaCode Project Guide
lastReviewed: 2026-11-17
reviewInterval: 90d
---

## 1. Project Overview

**LinguaCode** — Angular-приложение для изучения языков (Pinyin, Hanzi, IPA).

### Стек
- **Angular 22+** — standalone, signals, lazy `loadComponent`
- **TypeScript 6+** — strict mode, `type` вместо `interface`
- **RxJS 7+** — внешние потоки; локальное состояние — Signals
- **Angular Material** — UI
- **Vitest** — тесты (`types: ["vitest/globals"]`)
- **Prettier & ESLint** — форматирование и линтинг

### FSD-архитектура
- **`entities/`** — доменные сущности (card, course, scenario, chinese, auth, user…)
- **`features/`** — изолированные фичи (card-editor, card-select, course-builder…)
- **`pages/`** — страницы, lazy-loaded через `loadComponent`
- **`widgets/`** — переиспользуемые виджеты (layout, header, footer, sidebar, menus)
- **`shared/`** — domain-agnostic: api, logger, security, storage, sync, utils, ui, types

### Ключевые файлы
- `src/app/app.config.ts` — providers, initializers, content seed, auth restore
- `src/app/app.routes.ts` — routing (`loadComponent` only)
- `angular.json` — build/test targets
- `tsconfig.json` — strict mode, Vitest globals

---

## 2. References

### Документация
- [`docs/INDEX.md`](../../docs/INDEX.md) — оглавление
- [`docs/PRODUCT/ARCHITECTURE.md`](../../docs/PRODUCT/ARCHITECTURE.md) — архитектура
- [`docs/PRODUCT/DOMAIN.md`](../../docs/PRODUCT/DOMAIN.md) — доменная модель
- [`docs/COMMON/CARD-CATALOG.md`](../../docs/COMMON/CARD-CATALOG.md) — индекс карточек
- [`docs/CONTENT/CJK-CONTENT.md`](../../docs/CONTENT/CJK-CONTENT.md) — иероглифы, пиньинь
- [`docs/CONTENT/PHONETIC-CONTENT.md`](../../docs/CONTENT/PHONETIC-CONTENT.md) — IPA
- [`docs/API/API-CONTRACT.md`](../../docs/API/API-CONTRACT.md) — HTTP API
- [`docs/PROCESS/GIT-RULES.md`](../../docs/PROCESS/GIT-RULES.md) — Git workflow
- [`TASKS.md`](../../TASKS.md) — чеклист задач

### Архитектура подсистем
- [`docs/ARCHITECTURE/ARCHITECTURE.program.md`](../../docs/ARCHITECTURE/ARCHITECTURE.program.md)
- [`docs/ARCHITECTURE/ARCHITECTURE.course.md`](../../docs/ARCHITECTURE/ARCHITECTURE.course.md)
- [`docs/ARCHITECTURE/ARCHITECTURE.card-select.md`](../../docs/ARCHITECTURE/ARCHITECTURE.card-select.md)
- [`docs/ARCHITECTURE/ARCHITECTURE.home.md`](../../docs/ARCHITECTURE/ARCHITECTURE.home.md)

### Внешняя документация
- [Angular](https://angular.dev/docs)
- [Angular Material](https://material.angular.io/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vitest](https://vitest.dev/)

### Ссылки на правила проекта

Правила именуются: `NN.domain.NZ.name.rule.md` (`NN` — домен, `NZ` — сортировка).

#### meta (01) — процесс и инструменты
- `01.meta.01.agent-behavior.rule.md` — поведение агента, границы доступа
- `01.meta.02.validate-write-arguments.rule.md` — валидация write-инструментов
- `01.meta.03.git-workflow.rule.md` — Git workflow
- `01.meta.04.tasks-workflow.rule.md` — workflow с `TASKS.md`
- `01.meta.05.verification-checklist.rule.md` — чек-лист верификации
- `01.meta.06.docs-conventions.rule.md` — конвенции документации `docs/`
- `01.meta.07.ci-parity.rule.md` — паритет локальных проверок и CI
- `01.meta.08.dependencies.rule.md` — управление зависимостями
- `01.meta.09.rules-maintenance.rule.md` — поддержка правил
- `01.meta.10.anti-looping.rule.md` — предотвращение зацикливания
- `01.meta.11.rag.rule.md` — RAG: поиск в интернете
- `01.meta.12.built-in-tools.rule.md` — встроенные инструменты (MCP)
- `01.meta.13.rules-lifecycle.rule.md` — жизненный цикл правил

#### architecture (02) — структура проекта
- `02.architecture.01.project-architecture.rule.md` — FSD-слои
- `02.architecture.02.lazy-loading.rule.md` — lazy loading (`loadComponent`)
- `02.architecture.03.di-providers.rule.md` — DI и providers
- `02.architecture.04.fsd-imports.rule.md` — направления импортов
- `02.architecture.05.routing.rule.md` — маршрутизация, guards
- `02.architecture.06.component-patterns.rule.md` — OnPush, `inject()`
- `02.architecture.07.stores.rule.md` — signal-based stores
- `02.architecture.08.migration-standalone.rule.md` — миграция на standalone

#### angular (03) — код на Angular
- `03.angular.01.senior-developer.rule.md` — senior-разработчик
- `03.angular.02.build.rule.md` — сборка и оптимизация (Ivy)
- `03.angular.03.reactive.rule.md` — реактивные паттерны (Signals vs RxJS)
- `03.angular.04.typescript.rule.md` — TypeScript и строгость типов
- `03.angular.05.testing-strategy.rule.md` — тестирование, пороги покрытия
- `03.angular.06.code-style.rule.md` — стиль кода и форматирование
- `03.angular.07.naming.rule.md` — соглашения о названиях
- `03.angular.08.config-editing.rule.md` — правка конфиг-файлов
- `03.angular.09.control-flow.rule.md` — control flow (`@if`/`@for`/`@switch`/`@defer`/`@let`)
- `03.angular.10.signal-inputs.rule.md` — signal inputs / `model()` / `output()`
- `03.angular.11.forms.rule.md` — формы (template-driven, dirty-state)
- `03.angular.12.smoke-conformance.rule.md` — smoke и conformance тесты
- `03.angular.13.performance.rule.md` — производительность

#### design (04) — UI и UX
- `04.design.01.styles.rule.md` — SCSS/CSS-конвенции
- `04.design.02.a11y.rule.md` — доступность (a11y)
- `04.design.03.dialogs.rule.md` — модальные диалоги (MatDialog)
- `04.design.04.i18n.rule.md` — локализация UI (RU-строки)

#### business (05) — домен и данные
- `05.business.01.security.rule.md` — безопасность
- `05.business.02.data-content.rule.md` — данные/контент (seed, overlay)
- `05.business.03.errors-http.rule.md` — обработка ошибок и HTTP-слой
- `05.business.04.pwa.rule.md` — PWA / service worker
- `05.business.05.env-api-contract.rule.md` — окружение и API-контракт
- `05.business.06.backend-coordination.rule.md` — координация с бэкендом
- `05.business.07.auth.rule.md` — аутентификация
- `05.business.08.storage.rule.md` — хранение (IndexedDB, localStorage)

#### Obsolete rules — архив заменённых правил

| Устаревшее правило | Замена | Дата |
| ------------------ | ------ | ---- |
| *(пока нет)* | | |
