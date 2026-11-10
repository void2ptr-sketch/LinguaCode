# Shared Risks — Angular Agents

Общие риски и ограничения всех Angular-агентов проекта LinguaCode.

## Общие ограничения

### 1. Не выполняешь код за разработчика
- Анализируй, ревьювь, документируй — но не пиши production-код без явного запроса
- Предлагай решения, но применяй их пользователь

### 2. Не заменяешь CI/CD
- Ты — дополнительный слой качества, но `mvn verify` (backend) и `npm run verify` (frontend) — финальная проверка
- Всегда запускай `npm run verify` перед завершением задачи

### 3. Ссылайся на canonical rules
- При каждом решении ссылайся на правила из `.continue/rules/`
- Не выдумывай правила — используй существующие

## Риски по агентам

### angular-architecture-agent
- **Breaking changes** при миграциях Angular 17→22 (control flow, `inject()`, zoneless)
- **Signals**: `effect` вне injection context, лишние recomputes
- **DI**: дублирование инстансов из-за лишних `providers`
- **FSD**: циклические импорты features→entities→shared

### angular-code-reviewer-agent
- **False positives** на warnings — не блокируй merge за warnings
- **Пропуск critical** — всегда проверяй architectural boundaries и security
- **Контекст** — передавай только релевантные файлы, не весь проект

### angular-docs-writer-agent
- **Дрейф документации** — docs отстают от кода, обновляй в том же комите
- **Дублирование** — ссылайся на документы, не копируй контент
- **INDEX.md** — всегда обновляй оглавление при изменениях

### angular-security-auditor-agent
- **Ложная безопасность** — не полагайся только на автоматический аудит
- **Secrets** — проверяй `.env`, токены, API keys
- **XSS** — `[innerHTML]` без санитизации — критический риск

### angular-testing-agent
- **Flaky тесты** — таймеры и глобальный стейт под контролем
- **Покрытие "на бумаге"** — проверяй осмысленные ассерты, не только %
- **Vitest compatibility** — следи за версиями (Vitest 5 + Angular 22 + jsdom 30)

### angular-ui-agent
- **Конфликт стилей** — scoped SCSS vs глобальные стили/Material темы
- **a11y регрессии** — контраст, фокус-порядок, ARIA при каждом изменении шаблона
- **Производительность** — дорогие вычисления в шаблонах → `computed`/вынесенные свойства

### angular-refactor-agent
- **Нарушение сборки** — не ломай `ng build` на каждом этапе миграции
- **Падение тестов** — после рефакторинга гоняй Vitest, не снижай покрытие
- **Node.js версия** — требуется 24 LTS (см. `.nvmrc`)

### angular-integration-agent
- **CORS** — ошибки preflight/credentials; dev-прокси ≠ prod
- **Утечки токенов** — JWT в localStorage → XSS; предпочитай httpOnly cookies
- **Retry** — только для идемпотентных запросов (GET), с backoff
- **Версии API** — фиксируй версию в URL, проверяй совместимость

## Межкомандные риски (Angular + Java Backend)

### API Contract Drift
- Frontend и backend могут расходиться по контракту
- **Решение**: `docs/API/API-CONTRACT.md` — единственный источник истины
- Любое изменение эндпоинта требует обновления:
  1. API contract
  2. API service (frontend)
  3. Port interface
  4. Mock interceptor
  5. Conformance tests

### Data Format Mismatch
- Java использует camelCase, TypeScript может использовать разные конвенции
- **Решение**: маппинг в API services, не в компонентах

### Auth Coordination
- JWT token lifecycle должен быть синхронизирован
- `authEnabled` flag должен быть согласован между frontend и backend

### Migration Risks
- Изменения схемы БД (backend) могут сломать frontend queries
- **Решение**: координация через API contract, backward compatible changes

## Риски инструментов

### Ollama Models
- `qwen3-coder:latest` — может быть нестабилен, проверяй версии
- `qwen3.6-16G-UD-IQ3_S:35b` — большой контекст, но медленнее
- **Решение**: тестируй на critical задачах с более сильными моделями

### Continue MCP
- Built-in tools могут иметь ограничения по размеру файлов
- **Решение**: для больших файлов используй `read_file` с offset/limit

## Эскалация

Если агент не может решить задачу:
1. Проверь canonical rules — возможно, правило изменилось
2. Прочитай исходный код — docs могут устареть
3. Поищи в интернете — official docs > Stack Overflow > GitHub issues
4. Задай вопрос пользователю — если есть реальная неоднозначность

Не повторяй одну и ту же команду более 3 раз без изменения подхода (см. `01.meta.10.anti-looping.rule.md`).
