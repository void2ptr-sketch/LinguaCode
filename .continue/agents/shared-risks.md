# Shared Risks — Angular Agents

Общие риски и ограничения всех Angular-агентов проекта LinguaCode.

> **lastReviewed:** 2026-11-10 · **reviewInterval:** 90d

## Общие ограничения

### 1. Не заменяешь CI/CD

- `npm run verify` — финальная проверка; ты — дополнительный слой качества
- Всегда запускай `npm run verify` перед завершением задачи (lint + FSD + imports + barrels + hanzi sync + build + tests)
- См. `01.meta.05.verification-checklist.rule.md`, `01.meta.07.ci-parity.rule.md`

### 2. Ссылайся на canonical rules

- При каждом решении ссылайся на правила из `.continue/rules/`
- Не выдумывай правила — используй существующие
- `.continue/rules/` — единый источник истины для AI-поведения (см. `01.meta.09.rules-maintenance.rule.md`)

### 3. Не гадай — проверяй

- Проверяй факты в `package.json`, `angular.json`, `tsconfig.json` перед утверждениями о версиях/командах
- Если информации недостаточно — скажи «недостаточно данных», не выдумывай (см. `01.meta.01.agent-behavior.rule.md`)
- Для сложных случаев используй поиск в интернете вместо догадок (см. `01.meta.11.rag.rule.md`)

### 4. Anti-looping

- Не повторяй одну и ту же команду более 3 раз без изменения подхода
- После 3 неудачных попыток — остановись и пересмотри стратегию (см. `01.meta.10.anti-looping.rule.md`)

## Риски по агентам

### angular-architecture-agent

- **Breaking changes** при миграциях Angular 17→22 (control flow, `inject()`, zoneless)
- **Signals**: `effect` вне injection context, лишние recomputes
- **DI**: дублирование инстансов из-за лишних `providers`
- **FSD**: циклические импорты features→entities→shared — проверяй `npm run audit:fsd`
- **Lazy loading**: не ломай `loadComponent` паттерн в `app.routes.ts`

### angular-code-reviewer-agent

- **False positives** на warnings — не блокируй merge за warnings
- **Пропуск critical** — всегда проверяй architectural boundaries и security
- **Контекст** — передавай только релевантные файлы, не весь проект
- **Barrel exports** — проверяй `index.ts` через `npm run audit:barrels`

### angular-docs-writer-agent

- **Дрейф документации** — docs отстают от кода, обновляй в том же комите
- **Дублирование** — ссылайся на документы, не копируй контент
- **INDEX.md** — всегда обновляй оглавление при изменениях
- **Rules lifecycle** — при изменении правил обновляй `lastReviewed` и логируй в `RULES-CHANGELOG.md` (см. `01.meta.13.rules-lifecycle.rule.md`)

### angular-security-auditor-agent

- **Ложная безопасность** — не полагайся только на автоматический аудит
- **Secrets** — проверяй `.env`, токены, API keys; не ложи их в коммиты
- **XSS** — `[innerHTML]` без санитизации — критический риск
- **PWA** — чувствительные данные не должны кэшироваться в Service Worker

### angular-testing-agent

- **Flaky тесты** — таймеры и глобальный стейт под контролем
- **Покрытие «на бумаге»** — проверяй осмысленные ассерты, не только %
- **Vitest compatibility** — следи за версиями (Vitest + Angular 22 + jsdom)
- **Smoke/Conformance** — для новых маршрутов нужны `*.smoke.spec.ts`, для API — `*.conformance.spec.ts` (см. `03.angular.12.smoke-conformance.rule.md`)

### angular-ui-agent

- **Конфликт стилей** — scoped SCSS vs глобальные стили/Material темы
- **a11y регрессии** — контраст, фокус-порядок, ARIA при каждом изменении шаблона
- **Производительность** — дорогие вычисления в шаблонах → `computed`/вынесенные свойства
- **Control flow** — используй `@if`/`@for`/`@switch`/`@defer`, не `*ngIf`/`*ngFor`

### angular-refactor-agent

- **Нарушение сборки** — не ломай `ng build` на каждом этапе миграции
- **Падение тестов** — после рефакторинга гоняй Vitest, не снижай покрытие
- **Node.js версия** — требуется 24 LTS (см. `.nvmrc`)
- **Поэтапность** — разбивай миграцию на шаги, каждый шаг должен проходить `ng build` + `ng test`

### angular-integration-agent

- **CORS** — ошибки preflight/credentials; dev-прокси ≠ prod
- **Утечки токенов** — JWT в localStorage → XSS; предпочитай httpOnly cookies
- **Retry** — только для идемпотентных запросов (GET), с backoff
- **Версии API** — фиксируй версию в URL, проверяй совместимость контрактов
- **Sync queue** — offline mutations через `SyncQueueService` (см. `05.business.03.errors-http.rule.md`)

### angular-business-analyst-agent

- **Дрейф домена** — доменная модель может меняться; ссылайся на `docs/PRODUCT/DOMAIN.md`
- **TASKS.md** — единственный источник истины для статусов задач (G0–G16+)
- **Приоритизация** — используй RICE/MoSCoW, не предлагай фичи без анализа ценности

### ~~ollama-rules-config-agent~~

> ⛔ **DEPRECATED** — агент не используется. Не вызывать.

- ~~**Модель** — `qwen3.6-16G-UD-IQ3_S:35b` может быть медленной; проверяй доступность модели~~
- ~~**Modelfile синтаксис** — ошибки в FROM/SYSTEM/OPTIONS ломают всю конфигурацию~~
- ~~**RAG-контекст** — неправильная индексация папок → агент ссылается на устаревшие/нерелевантные файлы~~
- ~~**Параметры вывода** — temperature/top_p вне диапазона → непредсказуемый формат ответа~~
- ~~**Мультиагентная координация** — конфликт правил между агентами (например, ollama-rules vs orchestrator)~~

## Межкомандные риски (Angular + Java Backend)

### API Contract Drift

- Frontend и backend могут расходиться по контракту
- **Решение**: `docs/API/API-CONTRACT.md` — единственный источник истины
- Любое изменение эндпоинта требует обновления в одном комите:
  1. API contract
  2. API service (frontend)
  3. Port interface
  4. Mock interceptor
  5. Conformance tests
- См. `05.business.06.backend-coordination.rule.md`

### Data Format Mismatch

- Java использует camelCase, TypeScript может использовать разные конвенции
- **Решение**: маппинг в API services, не в компонентах

### Auth Coordination

- JWT token lifecycle должен быть синхронизирован
- `authEnabled` flag должен быть согласован между frontend и backend
- См. `05.business.07.auth.rule.md`

### Migration Risks

- Изменения схемы БД (backend) могут сломать frontend queries
- **Решение**: координация через API contract, backward compatible changes

## Риски инструментов

### Ollama Models

- `qwen3-coder:latest` — может быть нестабилен, проверяй версии
- `qwen3.6-16G-UD-IQ3_S:35b` — большой контекст, но медленнее (используется в orchestrator)
- **Решение**: тестируй на critical задачах с более сильными моделями

### Continue MCP — Built-in Tools

- Built-in tools могут иметь ограничения по размеру файлов
- **Решение**: для больших файлов используй `read_file` с offset/limit
- File glob и grep search — предпочтительнее `find`/`grep` через Bash

## Эскалация

Если агент не может решить задачу:

1. Проверь canonical rules — возможно, правило изменилось
2. Прочитай исходный код — docs могут устареть
3. Поищи в интернете — official docs > Stack Overflow > GitHub issues
4. Задай вопрос пользователю — если есть реальная неоднозначность

Не повторяй одну и ту же команду более 3 раз без изменения подхода (см. `01.meta.10.anti-looping.rule.md`).
